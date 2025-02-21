#
# Paths
#

root_path = '' # defaults to plugins folder
encodings_folder = 'star-identifier-encodings'
encodings_filename = 'star-identifier-encodings.npz'
encodings_error_filename = 'errors.json'

#
# Stash Settings
#

# The identifier will run on images / scenes tagged with this
tag_name_identify = 'star identifier'

# If the identifier can't find a face for a performer, 
# it will add this tag to that performer
tag_name_encoding_error = 'star identifier performer error'

#
# Star Identifier Settings
#

# Tolerance: How much distance between faces to consider it a match. 
# Lower is more strict. 0.6 is typical best performance.
tolerance = 0.6