# -----------------------------------------------------------------
# Available: $date $performer $title $studio $height $parent_studio
# -----------------------------------------------------------------
# e.g.:
# $title                                    == SSNI-000.mp4
# $date $title                              == 2017-04-27 Oni Chichi.mp4
# $date $title $height                      == 2017-04-27 Oni Chichi 1080p.mp4
# $date $performer - $title [$studio]       == 2016-12-29 Eva Lovia - Her Fantasy Ball [Sneaky Sex].mp4
# $parent_studio $date $performer - $title  == Reality Kings 2016-12-29 Eva Lovia - Her Fantasy Ball.mp4
# -----------------------------------------------------------------

western_result_template="$date $performer - $title [$studio]"
jav_result_template="$title"
anime_result_template="$date $title"

# IF YOU WANT TO FORCE A TEMPLATE FOR ANY FILE, UNCOMMENT BELOW
#result_template = "$date $title"
