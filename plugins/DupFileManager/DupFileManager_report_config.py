# Description: This is a Stash plugin which manages duplicate files.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link:
# https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/DupFileManager

# HTML Report Options **************************************************
report_config = {    
    # Paginate HTML report. Maximum number of results to display on one page, before adding (paginating) an additional page.
    "htmlReportPaginate" : 100,
    # Name of the HTML file to create
    "htmlReportName" : "DuplicateTagScenes.html",
    # If enabled, report displays an image preview similar to sceneDuplicateChecker
    "htmlIncludeImagePreview" : False,
    "htmlImagePreviewPopupSize" : 600,
    # HTML report prefix, before table listing
    "htmlReportPrefix" : """<!DOCTYPE html>
<html>
<head>
<title>Stash Duplicate Report</title>
<style>
h2 {text-align: center;}
table, th, td {border:1px solid black;}
.inline {
  display: inline;
}
.scene-details{text-align: center;font-size: small;}
.reason-details{text-align: left;font-size: small;}
.link-items{text-align: center;font-size: small;}
.link-button {
  background: none;
  border: none;
  color: blue;
  text-decoration: underline;
  cursor: pointer;
  font-size: 1em;
  font-family: serif;
  text-align: center;
  font-size: small;
}
.link-button:focus {
  outline: none;
}
.link-button:active {
  color:red;
}
ul {
  display: flex;
}

li {
  list-style-type: none;
  padding: 10px;
  position: relative;
}
.large {
  position: absolute;
  left: -9999px;
}
li:hover .large {
  left: 20px;
  top: -150px;
}
.large-image {
  border-radius: 4px;
   box-shadow: 1px 1px 3px 3px rgba(127, 127, 127, 0.15);;
}
</style>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://www.axter.com/js/jquery.prompt.js"></script>
<link rel="stylesheet" href="https://www.axter.com/js/jquery.prompt.css"/>
<script>
function trim(str, ch) {
    var start = 0, end = str.length;
    while(start < end && str[start] === ch) ++start;
    while(end > start && str[end - 1] === ch) --end;
    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}
function RunPluginOperation(Mode, ActionID, button, asyncAjax){
	var chkBxRemoveValid = document.getElementById("RemoveValidatePrompt");
    $.ajax({method: "POST", url: "http://localhost:9999/graphql", contentType: "application/json", dataType: "text", cache: asyncAjax, async: asyncAjax,
	data: JSON.stringify({
			query: `mutation RunPluginOperation($plugin_id:ID!,$args:Map!){runPluginOperation(plugin_id:$plugin_id,args:$args)}`,
			variables: {"plugin_id": "DupFileManager", "args": { "Target" : ActionID, "mode":Mode}},
		}), success: function(result){
			console.log(result);
            // if (Mode !== "flagScene") button.style.visibility = 'hidden';
            if (Mode === "renameFile"){
                var myArray = ActionID.split(":");
                $('.FN_ID_' + myArray[0]).text(trim(myArray[1],"'"));
            }
			if (!chkBxRemoveValid.checked) alert("Action " + Mode + " for scene(s) ID# " + ActionID + " complete.");
	}});
}
function selectMarker(Mode, ActionID, button){
	$('<p>Select desire marker type <select><option>yellow highlight</option><option>green highlight</option><option>orange highlight</option><option>cyan highlight</option><option>pink highlight</option><option>red highlight</option><option>strike-through</option><option>disable-scene</option><option>remove all flags</option></select></p>').confirm(function(answer){
		if(answer.response){
            console.log("Selected " + $('select',this).val());
            var flagType = $('select',this).val();
            if (flagType == null){
                console.log("Invalid flagType");
                return;
            }
            if (flagType === "yellow highlight")
                $('.ID_' + ActionID).css('background','yellow');
            else if (flagType === "green highlight")
                $('.ID_' + ActionID).css('background','#00FF00');
            else if (flagType === "orange highlight")
                $('.ID_' + ActionID).css('background','orange');
            else if (flagType === "cyan highlight")
                $('.ID_' + ActionID).css('background','cyan');
            else if (flagType === "pink highlight")
                $('.ID_' + ActionID).css('background','pink');
            else if (flagType === "red highlight")
                $('.ID_' + ActionID).css('background','red');
            else if (flagType === "strike-through")
                $('.ID_' + ActionID).css('text-decoration', 'line-through');
            else if (flagType === "disable-scene")
                $('.ID_' + ActionID).css({ 'background' : 'gray', 'pointer-events' : 'none' });
            else if (flagType === "remove all flags")
                $('.ID_' + ActionID).removeAttr('style'); //.css({ 'background' : '', 'text-decoration' : '', 'pointer-events' : '' });
            else {
                flagType = "none";
                $('.ID_' + ActionID).css("target-property", "");
                return;
            }
            ActionID = ActionID + ":" + flagType;
            console.log("ActionID = " + ActionID);
            RunPluginOperation(Mode, ActionID, button, false);
        }
        else console.log("Not valid response");
	});
}
$(document).ready(function(){
  $("button").click(function(){
    var Mode = this.value;
    var ActionID = this.id;
	if (ActionID === "AdvanceMenu")
    {
		var newUrl = window.location.href;
		newUrl = newUrl.replace(/report\/DuplicateTagScenes[_0-9]*.html/g, "advance_options.html?GQL=http://localhost:9999/graphql");
		window.open(newUrl, "_blank");
        return;
    }
	if (Mode === "deleteScene" || Mode === "removeScene"){
		var chkBxDisableDeleteConfirm = document.getElementById("RemoveToKeepConfirm");
        question = "Are you sure you want to delete this file and remove scene from stash?";
        if (Mode === "removeScene") question = "Are you sure you want to remove scene from stash?";
		if (!chkBxDisableDeleteConfirm.checked && !confirm(question))
			return;
        $('.ID_' + ActionID).css('background-color','gray');
        $('.ID_' + ActionID).css('pointer-events','none');
	}
	else if (Mode === "newName" || Mode === "renameFile"){
	    var myArray = ActionID.split(":");
		var promptStr = "Enter new name for scene ID " + myArray[0] + ", or press escape to cancel.";
		if (Mode === "renameFile") 
			promptStr = "Press enter to rename scene ID " + myArray[0] + ", or press escape to cancel.";
	    var newName=prompt(promptStr,trim(myArray[1], "'"));
	    if (newName === null)
	        return;
	    ActionID = myArray[0] + ":" + newName;
	    Mode = "renameFile";
    }
	else if (Mode === "flagScene"){
	    selectMarker(Mode, ActionID, this);
        return;
    }
    RunPluginOperation(Mode, ActionID, this, true);
  });
});
</script>
</head>
<body>
<center><table style="color:darkgreen;background-color:powderblue;">
<tr><th>Report Info</th><th>Report Options</th></tr>
<tr>
<td><table><tr>
<td>Found (QtyPlaceHolder) duplice sets</td>
<td>Date Created: (DateCreatedPlaceHolder)</td>
</tr></table></td>
<td><table><tr>
<td><input type="checkbox" id="RemoveValidatePrompt" name="RemoveValidatePrompt"><label for="RemoveValidatePrompt" title="Disable notice for task completion (Popup).">Disable Complete Confirmation</label><br></td>
<td><input type="checkbox" id="RemoveToKeepConfirm" name="RemoveToKeepConfirm"><label for="RemoveToKeepConfirm" title="Disable confirmation prompts for delete scenes">Disable Delete Confirmation</label><br></td>
<td><button id="AdvanceMenu" title="View advance menu for tagged duplicates." name="AdvanceMenu">Advance Tag Menu</button></td>
</tr></table></td>
</tr></table></center>
<h2>Stash Duplicate Scenes Report (MatchTypePlaceHolder)</h2>\n""",
    # HTML report postfiox, after table listing
    "htmlReportPostfix" : "\n</body></html>",
    # HTML report table
    "htmlReportTable" : "<table style=\"width:100%\">",
    # HTML report table row
    "htmlReportTableRow" : "<tr>",
    # HTML report table header
    "htmlReportTableHeader" : "<th>",
    # HTML report table data
    "htmlReportTableData" : "<td>",
     # HTML report video preview
    "htmlReportVideoPreview" : "width='160' height='120' controls", # Alternative option "autoplay loop controls" or "autoplay controls"
    # The number off seconds in time difference for supper highlight on htmlReport
    "htmlHighlightTimeDiff" : 3,
    # Supper highlight for details with higher resolution or duration
    "htmlSupperHighlight" : "yellow",
    # Lower highlight for details with slightly higher duration
    "htmlLowerHighlight" : "nyanza",
    # Text color for details with different resolution, duration, size, bitrate,codec, or framerate
    "htmlDetailDiffTextColor" : "red",
    # If enabled, create an HTML report when tagging duplicate files
    "createHtmlReport" : True,
    # If enabled, report displays stream instead of preview for video
    "streamOverPreview" : False, # This option works in Chrome, but does not work very well on firefox.
}
