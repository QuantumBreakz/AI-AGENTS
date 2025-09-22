from datetime import datetime, timezone
from random import choices
from typing import Optional

from jinja2 import Template
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import AsyncSessionLocal
from app.models.campaign import CampaignRecipient, Campaign, CampaignEmail, CampaignEmailVariant
from app.models.lead import Lead
from app.services.email.base import email_service, EmailMessage

async def render_template(template: Optional[str], context: dict) -> str:
	if not template:
		return ""
	return Template(template).render(**context)

async def pick_variant(email: CampaignEmail) -> CampaignEmailVariant | None:
	if not email.variants:
		return None
	labels = [v for v in email.variants]
	weights = [max(v.weight, 1) for v in labels]
	return choices(labels, weights, k=1)[0]

async def send_due_emails_once() -> int:
	"""Send due campaign emails once, return count sent."""
	now = datetime.now(timezone.utc)
	async with AsyncSessionLocal() as db:
		res = await db.execute(select(CampaignRecipient).where(CampaignRecipient.paused == False).where(CampaignRecipient.next_send_at <= now))
		recipients = list(res.scalars().all())
		sent = 0
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
			await email_service.send([EmailMessage(to=r.email, subject=subject or "", body=body or "")])
			r.current_step += 1
			r.last_sent_at = now
			from datetime import timedelta
			r.next_send_at = now + timedelta(hours=email_step.send_delay_hours)
			sent += 1
		await db.commit()
		return sent
