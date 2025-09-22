from typing import Optional

_FAQ = {
	"hours": "We are open 24/7.",
	"pricing": "Our pricing is tailored. A rep will follow up with details.",
}

async def answer(question: str) -> Optional[str]:
	q = question.lower().strip()
	for k, v in _FAQ.items():
		if k in q:
			return v
	return None
