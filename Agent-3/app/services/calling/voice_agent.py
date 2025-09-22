from typing import Mapping, Any

from app.services.personalization.templates import render_greeting
from app.services.ai.suggest import suggest

class VoiceAgent:
	async def greeting(self, business: Mapping[str, Any]) -> str:
		if business.get("greeting_script"):
			return business["greeting_script"]
		industry = business.get("industry") or "general"
		return render_greeting(industry, {"company_name": business.get("company_name") or "our business", "services_offered": business.get("services_offered") or "our services"})

	async def generate_pitch(self, context: Mapping[str, Any]) -> str:
		text = await suggest("pitch", context)
		return text or "I would love to share how we can help your team."

	async def handle_objection(self, objection: str, context: Mapping[str, Any]) -> str:
		text = await suggest("objection", {**context, "objection": objection})
		return text or "I understand. May I share how this has helped similar teams?"

voice_agent = VoiceAgent()
