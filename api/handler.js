const axios = require('axios');
const express = require('express');
const app = express();

const farcasterApiUrl = 'https://api.farcaster.xyz';
const apiKey = process.env.FARCASTER_API_KEY;
const openAiApiKey = process.env.OPENAI_API_KEY;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot is running.');
});

app.post('/', async (req, res) => {
  try {
    console.log('Received a POST request');
    const mentions = await getMentions();
    console.log('Mentions fetched:', mentions);

    const responses = await Promise.all(mentions.map(async (mention) => {
      console.log('Processing mention:', mention);
      const question = mention.text.replace('?heyaaron', '').trim();
      console.log('Question extracted:', question);
      const reply = await getChatGptResponse(question);
      console.log('Generated reply:', reply);
      await sendReply(mention.id, reply, mention.author_id);
      console.log('Reply sent for mention:', mention.id);
      return reply;
    }));

    res.status(200).json({ success: true, responses });
  } catch (error) {
    console.error('Error in POST handler:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const getMentions = async () => {
  try {
    console.log('Fetching mentions');
    const response = await axios.get(`${farcasterApiUrl}/mentions`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log('Mentions response:', response.data);
    const filteredMentions = response.data.mentions.filter(mention => mention.text.includes('?heyaaron'));
    console.log('Filtered mentions:', filteredMentions);
    return filteredMentions;
  } catch (error) {
    console.error('Error fetching mentions:', error);
    return [];
  }
};

const getChatGptResponse = async (question) => {
  try {
    console.log('Generating ChatGPT response for question:', question);
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
    console.log('ChatGPT response:', response.data);
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error getting response from ChatGPT:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
};

const sendReply = async (mentionId, reply, authorId) => {
  try {
    console.log('Sending reply:', reply);
    await axios.post(`${farcasterApiUrl}/casts`, {
      parent_id: mentionId,
      text: reply,
      author_id: authorId
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log('Reply sent successfully');
  } catch (error) {
    console.error('Error sending reply:', error);
  }
};

module.exports = app;
