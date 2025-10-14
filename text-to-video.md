# Wan 2.2 Text to Video Fast

> Wan2.2 transforms text and images into high-quality video clips with cinematic flair.


## Overview

- **Endpoint**: `https://api.segmind.com/v1/wan-2.2-t2v-fast`
- **Model ID**: `wan-2.2-t2v-fast`
- **Category**: textToVideo
- **Kind**: inference


## API Information

This model can be used via our HTTP API.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:

- **`seed`** (`integer`, _required_):
  Random seed for reproducibility. Use a fixed seed for consistent outputs or leave blank for randomness.
  - Default: `null`

- **`prompt`** (`string`, _required_):
  Prompt describes the scene. Choose vivid and clear descriptions for best results.
  - Examples: "A sophisticated Korean teacher in her early 30s, with sleek, black hair tied in a high bun and sharp, cat-like eyes, stands at the front of the room. She wears a tailored blazer and pencil skirt, exuding authority. As she writes on the chalkboard, the chalk’s texture against her fingers sends a jolt of pleasure through her. The camera lingers on her face—her composed expression cracks as her lips tremble, her eyes flutter, and unaware figures remain in the background."
  - Default: `"A sophisticated Korean teacher in her early 30s, with sleek, black hair tied in a high bun and sharp, cat-like eyes, stands at the front of the room. She wears a tailored blazer and pencil skirt, exuding authority. As she writes on the chalkboard, the chalk’s texture against her fingers sends a jolt of pleasure through her. The camera lingers on her face—her composed expression cracks as her lips tremble, her eyes flutter, and unaware figures remain in the background."`

- **`go_fast`** (`boolean`, _required_):
  Toggles speed of video creation. Set to true for quicker outputs.
  - Examples: true
  - Default: `true`

- **`num_frames`** (`integer`, _optional_):
  Total frames in the video. 81 frames offer optimal quality.
  - Examples: 81
  - Range: 81 to 100
  - Default: `81`

- **`resolution`** (`string`, _optional_):
  Select video resolution. Choose 480p for faster renders, 720p for quality.
  - Examples: "480p"
  - Options: "480p", "720p"
  - Default: `"480p"`

- **`aspect_ratio`** (`string`, _optional_):
  Aspect ratio of the video. 16:9 is standard, 9:16 for vertical.
  - Examples: "16:9"
  - Options: "16:9", "9:16"
  - Default: `"16:9"`

- **`sample_shift`** (`number`, _optional_):
  Controls frame sample shift. Increase for more motion variation.
  - Examples: 12
  - Range: 1 to 20
  - Default: `12`

- **`frames_per_second`** (`integer`, _optional_):
  Video FPS. 16 fps is balanced; increase for smoother motion.
  - Examples: 16
  - Range: 5 to 24
  - Default: `16`


**Required Parameters Example**:

```json
{
  "seed": null,
  "prompt": "A sophisticated Korean teacher in her early 30s, with sleek, black hair tied in a high bun and sharp, cat-like eyes, stands at the front of the room. She wears a tailored blazer and pencil skirt, exuding authority. As she writes on the chalkboard, the chalk’s texture against her fingers sends a jolt of pleasure through her. The camera lingers on her face—her composed expression cracks as her lips tremble, her eyes flutter, and unaware figures remain in the background.",
  "go_fast": true
}
```

**Full Example**:

```json
{
  "seed": null,
  "prompt": "A sophisticated Korean teacher in her early 30s, with sleek, black hair tied in a high bun and sharp, cat-like eyes, stands at the front of the room. She wears a tailored blazer and pencil skirt, exuding authority. As she writes on the chalkboard, the chalk’s texture against her fingers sends a jolt of pleasure through her. The camera lingers on her face—her composed expression cracks as her lips tremble, her eyes flutter, and unaware figures remain in the background.",
  "go_fast": true,
  "num_frames": 81,
  "resolution": "480p",
  "aspect_ratio": "16:9",
  "sample_shift": 12,
  "frames_per_second": 16
}
```


### Output Schema

The API returns the generated content as a raw file response.

- **Content-Type**: `video/mp4`
- **Response**: Raw video data

**Example Response**:

For successful requests, the response body contains the raw file data.

**HTTP Response Codes**:
- **200 - OK**: Video Generated
- **401 - Unauthorized**: User authentication failed
- **404 - Not Found**: The requested URL does not exist
- **405 - Method Not Allowed**: The requested HTTP method is not allowed
- **406 - Not Acceptable**: Not enough credits
- **500 - Server Error**: Server had some issue with processing


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://api.segmind.com/v1/wan-2.2-t2v-fast \
  --header "x-api-key: YOUR_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "seed": null,
     "prompt": "A sophisticated Korean teacher in her early 30s, with sleek, black hair tied in a high bun and sharp, cat-like eyes, stands at the front of the room. She wears a tailored blazer and pencil skirt, exuding authority. As she writes on the chalkboard, the chalk’s texture against her fingers sends a jolt of pleasure through her. The camera lingers on her face—her composed expression cracks as her lips tremble, her eyes flutter, and unaware figures remain in the background.",
     "go_fast": true
   }'
```

### Python

```python
import requests
import base64

# Use this function to convert an image file from the filesystem to base64
def image_file_to_base64(image_path):
    with open(image_path, 'rb') as f:
        image_data = f.read()
    return base64.b64encode(image_data).decode('utf-8')

# Use this function to fetch an image from a URL and convert it to base64
def image_url_to_base64(image_url):
    response = requests.get(image_url)
    image_data = response.content
    return base64.b64encode(image_data).decode('utf-8')

api_key = "YOUR_API_KEY"
url = "https://api.segmind.com/v1/wan-2.2-t2v-fast"

# Request payload
data = {
  "seed": null,
  "prompt": "A sophisticated Korean teacher in her early 30s, with sleek, black hair tied in a high bun and sharp, cat-like eyes, stands at the front of the room. She wears a tailored blazer and pencil skirt, exuding authority. As she writes on the chalkboard, the chalk’s texture against her fingers sends a jolt of pleasure through her. The camera lingers on her face—her composed expression cracks as her lips tremble, her eyes flutter, and unaware figures remain in the background.",
  "go_fast": true
}

headers = {'x-api-key': api_key}

response = requests.post(url, json=data, headers=headers)
print(response.content)  # The response is the generated video
```


## Additional Resources

### Documentation

- [Model Playground](https://www.segmind.com/models/wan-2.2-t2v-fast)
- [API Documentation](https://www.segmind.com/models/wan-2.2-t2v-fast/api)
- [Platform Documentation](https://docs.segmind.com/)