from datetime import datetime, timezone
from random import choices
import asyncio
from typing import Optional

from jinja2 import Environment, BaseLoader, select_autoescape
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import AsyncSessionLocal
from app.models.campaign import CampaignRecipient, Campaign, CampaignEmail, CampaignEmailVariant
from app.models.email_tracking import EmailMessageLog, CampaignRecipientEvent
from app.models.lead import Lead
from app.services.email.base import email_service, EmailMessage
from app.core.config import settings
from app.models.locks import SchedulerLock, SchedulerRun

jinja_env = Environment(loader=BaseLoader(), autoescape=select_autoescape(["html", "xml"]))

async def render_template(template: Optional[str], context: dict) -> str:
    if not template:
        return ""
    tmpl = jinja_env.from_string(template)
    return tmpl.render(**context)

async def pick_variant(email: CampaignEmail) -> CampaignEmailVariant | None:
	if not email.variants:
		return None
	labels = [v for v in email.variants]
	weights = [max(v.weight, 1) for v in labels]
	return choices(labels, weights, k=1)[0]

async def send_due_emails_once() -> int:
	"""Send due campaign emails once, return count sent."""
	now = datetime.now(timezone.utc)
	# Cooperative DB-backed lock to avoid multi-instance duplication
	lock_token = f"{now.timestamp()}"
	from sqlalchemy import update
	from datetime import timedelta
	async with AsyncSessionLocal() as db_lock:
		lock = await db_lock.get(SchedulerLock, "campaign_scheduler")
		expires = now + timedelta(seconds=55)
		owned = False
		if not lock:
			lock = SchedulerLock(name="campaign_scheduler", owner_token=lock_token, expires_at=expires)
			db_lock.add(lock)
			await db_lock.commit()
			owned = True
		else:
			if not lock.expires_at or lock.expires_at <= now:
				await db_lock.execute(update(SchedulerLock).where(SchedulerLock.name == "campaign_scheduler").values(owner_token=lock_token, expires_at=expires))
				await db_lock.commit()
				owned = True
		if not owned:
			return 0
	async with AsyncSessionLocal() as db:
		res = await db.execute(select(CampaignRecipient).where(CampaignRecipient.paused == False).where(CampaignRecipient.next_send_at <= now))
		recipients = list(res.scalars().all())
		sent = 0
		failed = 0
		run = SchedulerRun(owner_token=lock_token)
		db.add(run)
		for r in recipients:
			campaign = await db.get(Campaign, r.campaign_id)
			lead = await db.get(Lead, r.lead_id)
			if not campaign or not lead:
				continue
			steps = await db.execute(select(CampaignEmail).where(CampaignEmail.campaign_id == campaign.id).order_by(CampaignEmail.sequence_order))
			steps = list(steps.scalars().all())
			if r.current_step >= len(steps):
				r.paused = True
				continue
			email_step = steps[r.current_step]
			variant = await pick_variant(email_step)
			context = {"lead": lead.__dict__, "campaign": {"offer": campaign.offer}}
			subject = await render_template((variant and variant.subject_template) or email_step.subject_template, context)
			body = await render_template((variant and variant.body_template) or email_step.body_template, context)
			# Basic rate limiting
			await asyncio.sleep(max(0.0, 1.0 / max(1, settings.EMAIL_RATE_PER_SEC)))
			attempts = 0
			provider_id: str | None = None
			last_err: Exception | None = None
			while attempts < max(1, settings.EMAIL_MAX_RETRIES):
				try:
					results = await email_service.send([EmailMessage(to=r.email, subject=subject or "", body=body or "")])
					provider_id = results and results[0][0]
					break
				except Exception as e:
					last_err = e
					await asyncio.sleep(settings.EMAIL_RETRY_BACKOFF_SECS * (2 ** attempts))
					attempts += 1
			if last_err:
				# Log failure
				log = EmailMessageLog(
					recipient_id=r.id,
					lead_id=r.lead_id,
					provider=None,
					provider_message_id=None,
					status="failed",
					error=str(last_err),
					metadata={"to": r.email, "campaign_id": r.campaign_id, "subject": subject},
					subject=subject or None,
				)
				db.add(log)
				# Defer next retry after failure
				from datetime import timedelta
				r.next_send_at = now + timedelta(minutes=settings.EMAIL_FAILURE_DEFERRAL_MINUTES)
				r.last_sent_at = now
				failed += 1
				continue
			# Record send success in logs and recipient events
			log = EmailMessageLog(
				recipient_id=r.id,
				lead_id=r.lead_id,
				provider=settings.EMAIL_PROVIDER,
				provider_message_id=provider_id,
				status="sent",
				metadata={"to": r.email, "campaign_id": r.campaign_id, "subject": subject},
				subject=subject or None,
			)
			db.add(log)
			db.add(CampaignRecipientEvent(recipient_id=r.id, event_type="sent", payload={"subject": subject, "provider_id": provider_id}))
			r.current_step += 1
			r.last_sent_at = now
			from datetime import timedelta
			r.next_send_at = now + timedelta(hours=email_step.send_delay_hours)
			sent += 1
		from datetime import datetime as dt_naive
		run.sent_count = sent
		run.failed_count = failed
		run.run_finished_at = dt_naive.utcnow()
		await db.commit()
		return sent
