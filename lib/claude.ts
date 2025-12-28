import Anthropic from '@anthropic-ai/sdk';
import { ParsedResume } from './types';

// Lazy initialization of Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Parse resume text using Claude API
 * Extracts structured job search criteria from resume content
 */
export async function parseResume(resumeText: string): Promise<ParsedResume> {
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error('Resume text is empty');
  }

  const anthropic = getAnthropicClient();

  const prompt = `You are a resume parser. Extract the following information from this resume:

1. Job titles/roles the person has held
2. Skills (technical and soft)
3. Years of experience (total)
4. Current location or stated location preference
5. Industries they've worked in
6. Education level and field
7. Job type preferences (if stated): full-time, part-time, contract, remote

Return as JSON:
{
  "jobTitles": ["Title 1", "Title 2"],
  "skills": ["Skill 1", "Skill 2"],
  "yearsExperience": 5,
  "location": "City, State",
  "industries": ["Industry 1"],
  "education": "Bachelor's in X",
  "jobTypes": ["full-time", "remote"]
}

If information is not available, use null or empty array.

Resume content:
${resumeText}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the text content from the response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const responseText = content.text;

    // Parse JSON from the response
    // Claude might wrap JSON in markdown code blocks, so we need to extract it
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find JSON object in the response
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonText = objectMatch[0];
      }
    }

    const parsed = JSON.parse(jsonText) as ParsedResume;

    // Validate the parsed result has the expected structure
    if (typeof parsed !== 'object') {
      throw new Error('Parsed result is not an object');
    }

    // Ensure all required fields exist with proper defaults
    const validatedResult: ParsedResume = {
      jobTitles: Array.isArray(parsed.jobTitles) ? parsed.jobTitles : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      yearsExperience: typeof parsed.yearsExperience === 'number' ? parsed.yearsExperience : null,
      location: typeof parsed.location === 'string' ? parsed.location : null,
      industries: Array.isArray(parsed.industries) ? parsed.industries : [],
      education: typeof parsed.education === 'string' ? parsed.education : null,
      jobTypes: Array.isArray(parsed.jobTypes) ? parsed.jobTypes : [],
    };

    return validatedResult;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error: ${error.message}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse JSON response from Claude');
    }
    throw error;
  }
}

/**
 * Parse resume PDF using Claude API with PDF support
 * Sends the PDF directly to Claude which can extract and analyze the content
 * This works in serverless environments (unlike pdf-parse)
 */
export async function parseResumePDF(base64PDF: string): Promise<ParsedResume> {
  if (!base64PDF || base64PDF.length === 0) {
    throw new Error('PDF data is empty');
  }

  const anthropic = getAnthropicClient();

  const prompt = `You are a resume parser. Extract the following information from this resume PDF:

1. Job titles/roles the person has held
2. Skills (technical and soft)
3. Years of experience (total)
4. Current location or stated location preference
5. Industries they've worked in
6. Education level and field
7. Job type preferences (if stated): full-time, part-time, contract, remote

Return ONLY a JSON object with this exact structure:
{
  "jobTitles": ["Title 1", "Title 2"],
  "skills": ["Skill 1", "Skill 2"],
  "yearsExperience": 5,
  "location": "City, State",
  "industries": ["Industry 1"],
  "education": "Bachelor's in X",
  "jobTypes": ["full-time", "remote"]
}

If information is not available, use null or empty array. Do not include any other text besides the JSON.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64PDF,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract the text content from the response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const responseText = content.text;

    // Parse JSON from the response
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find JSON object in the response
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonText = objectMatch[0];
      }
    }

    const parsed = JSON.parse(jsonText) as ParsedResume;

    // Validate the parsed result has the expected structure
    if (typeof parsed !== 'object') {
      throw new Error('Parsed result is not an object');
    }

    // Ensure all required fields exist with proper defaults
    const validatedResult: ParsedResume = {
      jobTitles: Array.isArray(parsed.jobTitles) ? parsed.jobTitles : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      yearsExperience: typeof parsed.yearsExperience === 'number' ? parsed.yearsExperience : null,
      location: typeof parsed.location === 'string' ? parsed.location : null,
      industries: Array.isArray(parsed.industries) ? parsed.industries : [],
      education: typeof parsed.education === 'string' ? parsed.education : null,
      jobTypes: Array.isArray(parsed.jobTypes) ? parsed.jobTypes : [],
    };

    // Basic validation: ensure we got some useful data
    if (
      validatedResult.jobTitles.length === 0 &&
      validatedResult.skills.length === 0 &&
      !validatedResult.yearsExperience
    ) {
      throw new Error('We couldn\'t find enough information in your resume. Please ensure it contains your work history, skills, and experience.');
    }

    return validatedResult;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('Claude API Error:', error.status, error.message);
      throw new Error(`Claude API error: ${error.message}`);
    }
    if (error instanceof SyntaxError) {
      console.error('JSON Parse Error:', error.message);
      throw new Error('Failed to parse response from Claude. Please try again.');
    }
    throw error;
  }
}

/**
 * Validate that a resume has sufficient content for parsing
 */
export function validateResumeText(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Resume appears to be empty' };
  }

  if (text.trim().length < 50) {
    return { valid: false, error: 'Resume is too short (minimum 50 characters)' };
  }

  // Check if it contains some work-related keywords
  const hasWorkKeywords = /\b(experience|education|skills|work|job|position|role|employment|university|college|degree)\b/i.test(text);

  if (!hasWorkKeywords) {
    return { valid: false, error: 'We couldn\'t find enough information in your resume. Please upload a resume with your work history.' };
  }

  return { valid: true };
}
