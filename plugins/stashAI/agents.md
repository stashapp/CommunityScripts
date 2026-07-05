To use this application (cc1234/stashtag_onnx: Generate video frame tags and markers):
API schema: GET https://cc1234-stashtag-onnx.hf.space/gradio_api/info
Config (find fn_index): GET https://cc1234-stashtag-onnx.hf.space/config → dependencies[i].id where api_name matches API schema endpoint
Join the queue: POST https://cc1234-stashtag-onnx.hf.space/gradio_api/queue/join (pass {"data": [...], "fn_index": <from-config>, "session_hash": "<random-uuid>"})
Stream results: GET https://cc1234-stashtag-onnx.hf.space/gradio_api/queue/data?session_hash=<same-uuid>
File inputs: POST https://cc1234-stashtag-onnx.hf.space/gradio_api/upload -F "files=@file.ext", use as: {"path": "<returned-path>", "meta": {"_type": "gradio.FileData"}, "orig_name": "file.ext"}
Auth: Bearer $HF_TOKEN (https://huggingface.co/settings/tokens)