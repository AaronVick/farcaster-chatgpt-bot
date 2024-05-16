const axios = require('axios');

const farcasterApiUrl = 'https://api.farcaster.xyz';
const apiKey = process.env.FARCASTER_API_KEY;
const openAiApiKey = process.env.OPENAI_API_KEY;

module.exports = async (req, res) => {
  try {
    const mentions = await getMentions();
    const responses = await Promise.all(mentions.map(async (mention) => {
      const question = mention.text.replace('?heyaaron', '').trim();
      const reply = await getChatGptResponse(question);
      await sendReply(mention.id, reply);
      return reply;
    }));

    res.status(200).json({ success: true, responses });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMentions = async () => {
  try {
    const response = await axios.get(`${farcasterApiUrl}/mentions`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.data.mentions.filter(mention => mention.text.includes('?heyaaron'));
  } catch (error) {
    console.error('Error fetching mentions:', error);
    return [];
  }
};

const getChatGptResponse = async (question) => {
  try {
    const response = await axios.post('https://api.openai.com/v1/engines/davinci/completions', {
      prompt: question,
      max_tokens: 150,
      temperature: 0.7,
      top_p: 1.0,
      n: 1,
      stop: ["\n"]
    }, {
      headers: { 'Authorization': `Bearer ${openAiApiKey}` }
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error getting response from ChatGPT:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
};

const sendReply = async (mentionId, reply) => {
  try {
    await axios.post(`${farcasterApiUrl}/casts`, {
      parent_id: mentionId,
      text: reply
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
  } catch (error) {
    console.error('Error sending reply:', error);
  }
};
