CREATE_MARKERS = True
FRAME_INTERVAL = 2
IMAGE_THRESHOLD = 0.5

API_BASE_URL = 'http://localhost:8000'
IMAGE_REQUEST_BATCH_SIZE = 320
CONCURRENT_TASK_LIMIT = 10
SERVER_TIMEOUT = 3700
AI_VIDEO_THRESHOLD = 0.3

temp_image_dir = "./temp_images"
ai_base_tag_name = "AI"
tagme_tag_name = "AI_TagMe"
updateme_tag_name = "AI_UpdateMe"
aitagged_tag_name = "AI_Tagged"
aierrored_tag_name = "AI_Errored"

# Example for mutating paths
# path_mutation = {"E:": "F:", "G:": "D:"}
path_mutation = {}
