# Description: This is a Stash plugin which updates Stash if any changes occurs in the Stash library paths.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/ChangeFileMonitor
config = {
    # Enable to run metadata_generate (Generate Content) after metadata scan.
    "runGenerateContent": False,
    
    # The following fields are ONLY used when running ChangeFileMonitor in script mode
    "endpoint_Scheme" : "http", # Define endpoint to use when contacting the Stash server
    "endpoint_Host" : "0.0.0.0", # Define endpoint to use when contacting the Stash server
    "endpoint_Port" : 9999, # Define endpoint to use when contacting the Stash server
}
