# Local Performer Recognition

https://discourse.stashapp.cc/t/local-visage/2478

A plugin for recognizing performers from their images using [DeepFace](https://github.com/serengil/deepface). This plugin integrates seamlessly with Stash and enables automatic facial recognition by building or updating a local model trained from your existing image collection.

## 🔍 Features

- **Rebuild Face Recognition Model**  
  Completely rebuild the local facial recognition model using available images per performer.

- **Update Face Recognition Model**  
  Incrementally updates the model if performers have fewer images than the configured target count.

- **Automatic Server Control**  
  Easily start or stop the recognition server as needed—automatically starts when an image is queried.

- **Identify**  
  Click on the new icon next to an image to trigger performer identification.

## 📦 Requirements

- Python 3.10.11 (temporarily, see instructions below)
- `PythonDepManager`
- `stashUserscriptLibrary7djx1qp` (add repo https://7djx1qp.github.io/stash-plugins/

## ⚙️ Tasks

| Task                               | Description                                                           |
| ---------------------------------- | --------------------------------------------------------------------- |
| **Rebuild Face Recognition Model** | Fully rebuild the DeepFace model for all performers.                  |
| **Update Face Recognition Model**  | Add more images for performers with less than the target image count. |
| **Start Server**                   | Start the local DeepFace server if it's not already running.          |
| **Stop Server**                    | Gracefully stop the running recognition server.                       |

## 🔧 Settings

| Setting                        | Description                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------- |
| **Target image count per voy** | Number of images to use per performer when training the model. Default is `15`. |

## 🚀 Installation & Setup

### 1. Set Python Path to 3.10.11

To ensure compatibility with DeepFace and the plugin’s dependency resolution process:

- Temporarily set the Python path in your system/environment to **Python 3.10.11**.

### 2. Rebuild the Model

Run the **"Rebuild Face Recognition Model"** task. This will:

- Set up a virtual environment
- Install all necessary Python dependencies (DeepFace, etc.)
- Build the recognition model

### 3. Restore Python Path (Optional)

Once setup is complete, you can revert your Python path to its original version. The plugin will continue working with the generated virtual environment.

## 🖼 Usage

1. Once the model is built, navigate to an image in your Stash UI.
2. Click the **Performer Recognition** icon overlaying the image.
3. The plugin will:
   - Automatically start the recognition server if it's not already running
   - Query the server to identify the performer
   - Display the matched performer from the trained database
