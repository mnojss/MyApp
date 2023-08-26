const express = require('express');
const axios = require('axios').default;
const sharp = require('sharp');
const cors = require('cors'); // Import the 'cors' package

const app = express();

app.use(cors()); // Enable CORS for all routes

// Store generated image URLs on the server
const generatedImageUrls = [];

const base = "https://api.prodia.com/v1";
const headers = {
"X-Prodia-Key": "dcc3d74d-0c68-43a3-8077-ab66027df02b",
};

// Serve static files from the 'public' folder
app.use(express.static('public'));

const createJob = async (params) => {
  const { seed, ...restParams } = params;
  const response = await axios.post(`${base}/job`, { ...restParams }, {
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });

  if (response.status !== 200) {
    throw new Error(`Bad Prodia Response: ${response.status}`);
  }

  return response.data;
};

const getJob = async (jobId) => {
  const response = await axios.get(`${base}/job/${jobId}`, {
    headers,
  });

  if (response.status !== 200) {
    throw new Error(`Bad Prodia Response: ${response.status}`);
  }

  return response.data;
};

const runScript = async (prompt, negativePrompt) => {
  try {
    console.log("Prompt:", prompt);
    console.log("Negative Prompt:", negativePrompt); // Check the received value

    // ... Rest of the code ...

    let job = await createJob({
      model: "Realistic_Vision_V4.0.safetensors [29a7afaa]",
      prompt: prompt,
      negative_prompt: negativePrompt, // Pass the received value to the 'negative_prompt'
      seed: 100,
      steps: 30,
      cfg_scale: 7,
    });


    console.log("Job details:", job);

    while (job.status !== "succeeded" && job.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 250));
      job = await getJob(job.job);
    }

    if (job.status !== "succeeded") {
      throw new Error("Job failed!");
    }

    if (!job.imageUrl) {
      throw new Error("Generated image URL not found!");
    }

    return job.imageUrl;
  } catch (error) {
    console.error("Error occurred in runScript:", error);
    throw error;
  }
};

const resizeImage = async (imageUrl, width, height) => {
  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
  });

  const resizedImageBuffer = await sharp(imageResponse.data)
    .resize(width, height)
    .toBuffer();

  return resizedImageBuffer;
};

// API route to handle storing generated image URLs
app.post('/store-generated-image-url', (req, res) => {
  const imageUrl = req.body.imageUrl;
  generatedImageUrls.push(imageUrl);
  res.status(200).send('Image URL stored successfully.');
});

// API route to handle retrieving stored image URLs
app.get('/get-generated-image-urls', (req, res) => {
  res.json(generatedImageUrls);
});

app.get('/generate-image', async (req, res) => {
  try {
    const { prompt, negativePrompt } = req.query;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt parameter is missing.' });
    }

    const imageUrl = await runScript(prompt, negativePrompt);

    const resizedImageBuffer = await resizeImage(imageUrl, 400, 400);

    res.set('Content-Type', 'image/png');
    res.send(resizedImageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error occurred while generating or displaying the image.' });
  }
});

const port = 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
