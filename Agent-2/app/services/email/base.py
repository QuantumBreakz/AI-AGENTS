from typing import List, Tuple
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailMessage:
	def __init__(self, to: str, subject: str, body: str, html_body: str = None) -> None:
		self.to = to
		self.subject = subject
		self.body = body
		self.html_body = html_body


class EmailService:
	async def send(self, messages: List[EmailMessage]) -> List[Tuple[str | None, str]]:
		raise NotImplementedError

# Gmail SMTP implementation
class GmailSMTPEmailService(EmailService):
	async def send(self, messages: List[EmailMessage]) -> List[Tuple[str | None, str]]:
		if not (settings.GMAIL_SMTP_API_KEY and settings.EMAIL_FROM):
			raise RuntimeError("Gmail SMTP not configured; set GMAIL_SMTP_API_KEY and EMAIL_FROM")
		
		# Gmail SMTP configuration
		smtp_server = "smtp.gmail.com"
		port = 587
		
		# Create SMTP session
		context = ssl.create_default_context()
		
		results: List[Tuple[str | None, str]] = []
		try:
			with smtplib.SMTP(smtp_server, port) as server:
				server.starttls(context=context)
				# Use the API key as password for Gmail
				server.login(settings.EMAIL_FROM, settings.GMAIL_SMTP_API_KEY)
				
				for message in messages:
					# Create message
					msg = MIMEMultipart('alternative')
					msg['Subject'] = message.subject
					msg['From'] = settings.EMAIL_FROM
					msg['To'] = message.to
					
					# Add text and HTML parts
					text_part = MIMEText(message.body, 'plain')
					msg.attach(text_part)
					
					if message.html_body:
						html_part = MIMEText(message.html_body, 'html')
						msg.attach(html_part)
					
					# Send email
					resp = server.send_message(msg)
					# SMTP doesn't return a message-id when using send_message easily; capture from headers if present
					provider_id = msg.get('Message-Id') or None
					results.append((provider_id, message.to))
					logger.info(f"Email sent successfully to {message.to}")
					
		except Exception as e:
			logger.error(f"Failed to send email via Gmail SMTP: {str(e)}")
			raise
		return results

# SES implementation
class SESEmailService(EmailService):
	async def send(self, messages: List[EmailMessage]) -> List[Tuple[str | None, str]]:
		import boto3
		from botocore.config import Config as BotoConfig
		if not (settings.SES_REGION and settings.EMAIL_FROM):
			raise RuntimeError("SES not configured; set SES_REGION and EMAIL_FROM")
		ses = boto3.client("ses", region_name=settings.SES_REGION, config=BotoConfig(retries={"max_attempts": 3}))
		results: List[Tuple[str | None, str]] = []
		for m in messages:
			resp = ses.send_email(
				Source=settings.EMAIL_FROM,
				Destination={"ToAddresses": [m.to]},
				Message={
					"Subject": {"Data": m.subject},
					"Body": {"Text": {"Data": m.body}},
				},
			)
			provider_id = resp.get("MessageId")
			results.append((provider_id, m.to))
		return results

# SendGrid implementation
class SendGridEmailService(EmailService):
	async def send(self, messages: List[EmailMessage]) -> List[Tuple[str | None, str]]:
		import httpx
		if not (settings.SENDGRID_API_KEY and settings.EMAIL_FROM):
			raise RuntimeError("SendGrid not configured; set SENDGRID_API_KEY and EMAIL_FROM")
		results: List[Tuple[str | None, str]] = []
		async with httpx.AsyncClient(timeout=30) as client:
			for m in messages:
				payload = {
					"personalizations": [{"to": [{"email": m.to}]}],
					"from": {"email": settings.EMAIL_FROM},
					"subject": m.subject,
					"content": [{"type": "text/plain", "value": m.body}],
				}
				resp = await client.post(
					"https://api.sendgrid.com/v3/mail/send",
					headers={"Authorization": f"Bearer {settings.SENDGRID_API_KEY}", "Content-Type": "application/json"},
					json=payload,
				)
				provider_id = resp.headers.get("X-Message-Id") or None
				results.append((provider_id, m.to))
		return results

def get_email_service() -> EmailService:
	if settings.EMAIL_PROVIDER == "gmail":
		return GmailSMTPEmailService()
	elif settings.EMAIL_PROVIDER == "sendgrid":
		return SendGridEmailService()
	else:
		return SESEmailService()

email_service = get_email_service()
