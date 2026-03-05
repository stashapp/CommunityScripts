import os
import sys
# Set DeepFace home directory
os.environ["DEEPFACE_HOME"] = "."
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"  # Suppress TF logs
# Add the plugins directory to sys.path
plugins_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if plugins_dir not in sys.path:
    sys.path.insert(0, plugins_dir)


from stashapi.stashapp import StashInterface


try:
    from models.data_manager import DataManager
    from web.interface import WebInterface
except ImportError as e:
    print(f"Error importing modules: {e}")
    input("Ensure you have installed the required dependencies. Press Enter to exit.")



def main():
    """Main entry point for the application"""
    # Initialize data manager
    data_manager = DataManager(
        voy_root_folder=os.path.abspath(os.path.join(os.path.dirname(__file__),"../voy_db")),
    )

    # Initialize and launch web interface
    web_interface = WebInterface(data_manager, default_threshold=0.5)
    web_interface.launch(server_name="0.0.0.0", server_port=7860, share=False)

if __name__ == "__main__":
    main()
