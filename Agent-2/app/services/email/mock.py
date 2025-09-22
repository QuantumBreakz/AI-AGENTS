from typing import Sequence

from app.services.email.base import EmailMessage, EmailService

class MockEmailService:
	async def send(self, messages: Sequence[EmailMessage]) -> None:
		# In real impl, integrate SendGrid/Mailgun/SES
		for _ in messages:
			pass

email_service: EmailService = MockEmailService()
