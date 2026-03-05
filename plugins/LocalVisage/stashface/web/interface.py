import gradio as gr
from typing import Dict, Any

from models.data_manager import DataManager
from models.image_processor import (
    image_search_performer,
    image_search_performers,
    find_faces_in_sprite
)

class WebInterface:
    def __init__(self, data_manager: DataManager, default_threshold: float = 0.5):
        """
        Initialize the web interface.

        Parameters:
        data_manager: DataManager instance
        default_threshold: Default confidence threshold
        """
        self.data_manager = data_manager
        self.default_threshold = default_threshold

    def image_search(self, img, threshold, results):
        """Wrapper for the image search function"""
        return image_search_performer(img, self.data_manager, threshold, results)

    def multiple_image_search(self, img, threshold, results):
        """Wrapper for the multiple image search function"""
        return image_search_performers(img, self.data_manager, threshold, results)

    def vector_search(self, vector_json, threshold, results):
        """Wrapper for the vector search function (deprecated)"""
        return {'status': 'not implemented'}

    def _create_image_search_interface(self):
        """Create the single face search interface"""
        with gr.Blocks() as interface:
            gr.Markdown("# Who is in the photo?")
            gr.Markdown("Upload an image of a person and we'll tell you who it is.")

            with gr.Row():
                with gr.Column():
                    img_input = gr.Image()
                    threshold = gr.Slider(
                        label="threshold",
                        minimum=0.0,
                        maximum=1.0,
                        value=self.default_threshold
                    )
                    results_count = gr.Slider(
                        label="results",
                        minimum=0,
                        maximum=50,
                        value=3,
                        step=1
                    )
                    search_btn = gr.Button("Search")

                with gr.Column():
                    output = gr.JSON(label="Results")

            search_btn.click(
                fn=self.image_search,
                inputs=[img_input, threshold, results_count],
                outputs=output
            )

        return interface

    def _create_multiple_image_search_interface(self):
        """Create the multiple face search interface"""
        with gr.Blocks() as interface:
            gr.Markdown("# Who is in the photo?")
            gr.Markdown("Upload an image of a person(s) and we'll tell you who it is.")

            with gr.Row():
                with gr.Column():
                    img_input = gr.Image(type="pil")
                    threshold = gr.Slider(
                        label="threshold",
                        minimum=0.0,
                        maximum=1.0,
                        value=self.default_threshold
                    )
                    results_count = gr.Slider(
                        label="results",
                        minimum=0,
                        maximum=50,
                        value=3,
                        step=1
                    )
                    search_btn = gr.Button("Search")

                with gr.Column():
                    output = gr.JSON(label="Results")

            search_btn.click(
                fn=self.multiple_image_search,
                inputs=[img_input, threshold, results_count],
                outputs=output
            )

        return interface

    def _create_vector_search_interface(self):
        """Create the vector search interface (deprecated)"""
        with gr.Blocks() as interface:
            gr.Markdown("# Vector Search (deprecated)")

            with gr.Row():
                with gr.Column():
                    vector_input = gr.Textbox()
                    threshold = gr.Slider(
                        label="threshold",
                        minimum=0.0,
                        maximum=1.0,
                        value=self.default_threshold
                    )
                    results_count = gr.Slider(
                        label="results",
                        minimum=0,
                        maximum=50,
                        value=3,
                        step=1
                    )
                    search_btn = gr.Button("Search")

                with gr.Column():
                    output = gr.JSON(label="Results")

            search_btn.click(
                fn=self.vector_search,
                inputs=[vector_input, threshold, results_count],
                outputs=output
            )

        return interface

    def _create_faces_in_sprite_interface(self):
        """Create the faces in sprite interface"""
        with gr.Blocks() as interface:
            gr.Markdown("# Find Faces in Sprite")

            with gr.Row():
                with gr.Column():
                    img_input = gr.Image()
                    vtt_input = gr.Textbox(label="VTT file")
                    search_btn = gr.Button("Process")

                with gr.Column():
                    output = gr.JSON(label="Results")

            search_btn.click(
                fn=find_faces_in_sprite,
                inputs=[img_input, vtt_input],
                outputs=output
            )

        return interface

    def launch(self, server_name="0.0.0.0", server_port=7860, share=True):
        """Launch the web interface"""
        with gr.Blocks() as demo:
            with gr.Tabs() as tabs:
                with gr.TabItem("Single Face Search"):
                    self._create_image_search_interface()
                with gr.TabItem("Multiple Face Search"):
                    self._create_multiple_image_search_interface()
                with gr.TabItem("Vector Search"):
                    self._create_vector_search_interface()
                with gr.TabItem("Faces in Sprite"):
                    self._create_faces_in_sprite_interface()

        demo.queue().launch(server_name=server_name,server_port=server_port,share=share, ssr_mode=False)
