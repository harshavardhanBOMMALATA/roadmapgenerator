import json
import re
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from httpx import request
from openai import OpenAI
apikey="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"



client = OpenAI(
    api_key=apikey,
    base_url="https://api.groq.com/openai/v1"
)



def home(request):
    return render(request, 'index.html')




@csrf_exempt
def roadmap_generator(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=405)

    try:
        # ===== EXTRACT BODY =====
        body = json.loads(request.body)

        role = body.get("role", "").strip()
        current_education = body.get("current_education", "").strip()
        duration = body.get("duration", "").strip()

        if not role or not current_education or not duration:
            return JsonResponse({"error": "All fields are required"}, status=400)

        # ===== CONVERT TO DAYS =====
        duration = duration.lower()

        match = re.search(r"\d+", duration)
        value = int(match.group()) if match else 1

        if "year" in duration:
            total_days = value * 365
        elif "month" in duration:
            total_days = value * 30
        elif "day" in duration:
            total_days = value
        else:
            total_days = value * 30

        # ===== PROMPT =====
        prompt = f"""
Create a structured career roadmap.

Role: {role}
Current Education: {current_education}
Total Duration: {total_days} days

STRICT RULES:
1. Divide roadmap into phases.
2. Total sum of all days_count must equal exactly {total_days}.
3. Each phase must include:
   - phase_number (sequential starting from 1)
   - phase_name
   - days_count
   - 5 key learning points (each 10–15 words)
   - resources (array with title and link)
   - projects (array with title and description)

4. Add one extra final phase named:
   "Market Opportunities"
   This phase must NOT contain days_count.
   Include:
   - expected_roles
   - salaries
   - companies
   - opportunity_links

Return ONLY valid JSON.
Do not include explanation text.
"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You generate strictly valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4
        )

        ai_text = response.choices[0].message.content.strip()

        return JsonResponse({"roadmap": ai_text})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
