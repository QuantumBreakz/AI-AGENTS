from typing import Mapping, Any

INDUSTRY_TEMPLATES = {
	"pizza_shop": {
		"greeting": "Thanks for calling {{company_name}}. Would you like to place an order or ask about specials?",
	},
	"barbershop": {
		"greeting": "Welcome to {{company_name}}. Do you want to book a haircut or beard trim?",
	},
	"mechanics": {
		"greeting": "{{company_name}} auto service. Are you calling about repairs, maintenance, or diagnostics?",
	},
	"contractors": {
		"greeting": "{{company_name}}. We handle {{services_offered}}. How can we help today?",
	},
	"general": {
		"greeting": "Thanks for calling {{company_name}}. How can we help you today?",
	},
}

from jinja2 import Template

def render_greeting(industry: str, context: Mapping[str, Any]) -> str:
	tpl = (INDUSTRY_TEMPLATES.get(industry) or INDUSTRY_TEMPLATES["general"]).get("greeting")
	return Template(tpl).render(**context)
