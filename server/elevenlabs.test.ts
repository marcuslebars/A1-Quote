import { describe, it, expect } from 'vitest';

describe('ElevenLabs Integration', () => {
  it('should have valid ElevenLabs credentials configured', () => {
    expect(process.env.ELEVENLABS_AGENT_ID).toBeDefined();
    expect(process.env.ELEVENLABS_API_KEY).toBeDefined();
    
    // Validate format
    expect(process.env.ELEVENLABS_AGENT_ID).toMatch(/^agent_/);
    expect(process.env.ELEVENLABS_API_KEY).toMatch(/^sk_/);
  });

  it('should validate ElevenLabs API key format', async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey?.length).toBeGreaterThan(20);
  });
});
