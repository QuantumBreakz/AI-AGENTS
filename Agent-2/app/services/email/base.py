from typing import List

from app.core.config import settings

class EmailMessage:
	def __init__(self, to: str, subject: str, body: str) -> None:
		self.to = to
		self.subject = subject
		self.body = body

class EmailService:
	async def send(self, messages: List[EmailMessage]) -> None:
		raise NotImplementedError

# SES implementation
class SESEmailService(EmailService):
	async def send(self, messages: List[EmailMessage]) -> None:
		import boto3
		from botocore.config import Config as BotoConfig
		if not (settings.SES_REGION and settings.EMAIL_FROM):
			raise RuntimeError("SES not configured; set SES_REGION and EMAIL_FROM")
		ses = boto3.client("ses", region_name=settings.SES_REGION, config=BotoConfig(retries={"max_attempts": 3}))
		for m in messages:
			ses.send_email(
				Source=settings.EMAIL_FROM,
				Destination={"ToAddresses": [m.to]},
				Message={
					"Subject": {"Data": m.subject},
					"Body": {"Text": {"Data": m.body}},
				},
			)

# SendGrid implementation
class SendGridEmailService(EmailService):
	async def send(self, messages: List[EmailMessage]) -> None:
		import httpx
		if not (settings.SENDGRID_API_KEY and settings.EMAIL_FROM):
			raise RuntimeError("SendGrid not configured; set SENDGRID_API_KEY and EMAIL_FROM")
		async with httpx.AsyncClient(timeout=30) as client:
			for m in messages:
				payload = {
					"personalizations": [{"to": [{"email": m.to}]}],
					"from": {"email": settings.EMAIL_FROM},
					"subject": m.subject,
					"content": [{"type": "text/plain", "value": m.body}],
				}
				await client.post(
					"https://api.sendgrid.com/v3/mail/send",
					headers={"Authorization": f"Bearer {settings.SENDGRID_API_KEY}", "Content-Type": "application/json"},
					json=payload,
				)

def get_email_service() -> EmailService:
	if settings.EMAIL_PROVIDER == "sendgrid":
		return SendGridEmailService()
	return SESEmailService()

email_service = get_email_service()
