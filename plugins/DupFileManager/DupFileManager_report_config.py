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
/******** Dropdown buttons *********/
.dropdown {
  font-size: 14px;
  border: none;
  outline: none;
  color: white;
  padding: 6px 10px;
  background-color: transparent;
  font-family: inherit; /* Important for vertical align on mobile phones */
  margin: 0; /* Important for vertical align on mobile phones */
}
.dropdown-content{
  display: none;
  position: absolute;
  background-color: inherit;
  min-width: 80px;
  box-shadow: 0px 4px 12px 0px rgba(0,0,0,0.2);
  z-index: 1;
}
.dropdown-content a {
  float: none;
  color: black;
  padding: 6px 10px;
  text-decoration: none;
  display: block;
  text-align: left;
}
.dropdown:hover .dropdown-content {
  display: block;
}
/*** Dropdown Buttons in Table ***/
.dropbtn_table {
  font-size: 14px;
  border: none;
  outline: none;
  color: white;
  padding: 6px 10px;
  background-color: transparent;
  font-family: inherit; /* Important for vertical align on mobile phones */
  margin: 0; /* Important for vertical align on mobile phones */
  float:left;
}
.dropbtn_table-content{
  display: none;
  position: absolute;
  background-color: inherit;
  min-width: 80px;
  box-shadow: 0px 4px 12px 0px rgba(0,0,0,0.2);
  z-index: 1;
}
.dropbtn_table:hover .dropbtn_table-content {
  display: block;
} 
.links_table-content{
  display: none;
  position: absolute;
  background-color: AntiqueWhite;
  min-width: 80px;
  box-shadow: 0px 4px 12px 0px rgba(0,0,0,0.2);
  z-index: 1;
}
.dropbtn_table:hover .links_table-content {
  display: block;
} 
/*************-- Dropdown Icons --*************/
.dropdown_icon {
	height:22px;
	width:30px;
	float:left;
}
/*** Dropdown Tag ***/
.dropdown_tag-content{
  display: none;
  position: absolute;
  background-color: LightCoral;
  min-width: 80px;
  box-shadow: 0px 4px 12px 0px rgba(0,0,0,0.2);
  z-index: 1;
}
.dropdown_icon:hover .dropdown_tag-content {
  display: block;
} 
/*** Dropdown Performer ***/
.dropdown_performer-content{
  display: none;
  position: absolute;
  background-color: LightBlue;
  min-width: 80px;
  box-shadow: 0px 4px 12px 0px rgba(0,0,0,0.2);
  z-index: 1;
}
.dropdown_icon:hover .dropdown_performer-content {
  display: block;
}
/*** Dropdown Gallery ***/
.dropdown_gallery-content{
  display: none;
  position: absolute;
  background-color: AntiqueWhite;
  min-width: 80px;
  box-shadow: 0px 4px 12px 0px rgba(0,0,0,0.2);
  z-index: 1;
}
.dropdown_icon:hover .dropdown_gallery-content {
  display: block;
}
/*** Dropdown Group ***/
.dropdown_group-content{
  display: none;
  position: absolute;
  background-color: BurlyWood;
  min-width: 80px;
  box-shadow: 0px 4px 12px 0px rgba(0,0,0,0.2);
  z-index: 1;
}
.dropdown_icon:hover .dropdown_group-content {
  display: block;
}
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
<script src="https://www.axter.com/js/jquery-3.7.1.min.js"></script>
<script src="https://www.axter.com/js/jquery.prompt.js"></script>
<link rel="stylesheet" href="https://www.axter.com/js/jquery.prompt.css"/>
<script>
var apiKey = "";
var GraphQl_URL = "http://localhost:9999/graphql";
var OrgPrevPage = null;
var OrgNextPage = null;
var OrgHomePage = null;
var RemoveToKeepConfirmValue = null;
var RemoveValidatePromptValue = null;
const StrRemoveToKeepConfirm = "RemoveToKeepConfirm=";
const StrRemoveValidatePrompt = "RemoveValidatePrompt=";
function SetPaginateButtonChange(){
    var chkBxRemoveValid = document.getElementById("RemoveValidatePrompt");
    var chkBxDisableDeleteConfirm = document.getElementById("RemoveToKeepConfirm");
    RemoveToKeepConfirmValue = StrRemoveToKeepConfirm + "false";
    RemoveValidatePromptValue = StrRemoveValidatePrompt + "false";
    if (chkBxRemoveValid.checked)
        RemoveToKeepConfirmValue = StrRemoveToKeepConfirm + "true";
    if (chkBxDisableDeleteConfirm.checked)
        RemoveValidatePromptValue = StrRemoveValidatePrompt + "true";
    document.cookie = RemoveToKeepConfirmValue + "&" + RemoveValidatePromptValue + ";";
    console.log("Cookies = " + document.cookie);
}
function trim(str, ch) {
    var start = 0, end = str.length;
    while(start < end && str[start] === ch) ++start;
    while(end > start && str[end - 1] === ch) --end;
    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}
function RunPluginOperation(Mode, ActionID, button, asyncAjax){
	if (asyncAjax){
        $('html').addClass('wait');
        $("body").css("cursor", "progress");
    }
	var chkBxRemoveValid = document.getElementById("RemoveValidatePrompt");
    if (apiKey !== "")
        $.ajaxSetup({beforeSend: function(xhr) {xhr.setRequestHeader('apiKey', apiKey);}});    
    $.ajax({method: "POST", url: GraphQl_URL, contentType: "application/json", dataType: "text", cache: asyncAjax, async: asyncAjax,
	data: JSON.stringify({
			query: `mutation RunPluginOperation($plugin_id:ID!,$args:Map!){runPluginOperation(plugin_id:$plugin_id,args:$args)}`,
			variables: {"plugin_id": "DupFileManager", "args": { "Target" : ActionID, "mode":Mode}},
		}), success: function(result){
			console.log(result);
            if (asyncAjax){
                $('html').removeClass('wait');
                $("body").css("cursor", "default");
            }
            if (Mode === "renameFile" || Mode === "clearAllSceneFlags" || Mode === "mergeTags" || (Mode !== "deleteScene" && Mode.startsWith("deleteScene")))
                location.href = location.href; // location.replace(location.href);
			if (!chkBxRemoveValid.checked && Mode !== "flagScene") alert("Action " + Mode + " for scene(s) ID# " + ActionID + " complete.\\n\\nResults=" + result);
		}, error: function(XMLHttpRequest, textStatus, errorThrown) { 
			console.log("Ajax failed with Status: " + textStatus + "; Error: " + errorThrown); 
            if (asyncAjax){
                $('html').removeClass('wait');
                $("body").css("cursor", "default");
            }
		}  
	});
}
function SetFlagOnScene(flagType, ActionID){
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
	else
		return false;
	return true;
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
			if (!SetFlagOnScene(flagType, ActionID))
				return;
            ActionID = ActionID + ":" + flagType;
            console.log("ActionID = " + ActionID);
            RunPluginOperation(Mode, ActionID, button, false);
        }
        else console.log("Not valid response");
	});
}
$(document).ready(function(){
    OrgPrevPage = $("#PrevPage").attr('href');
    OrgNextPage = $("#NextPage").attr('href');
    OrgHomePage = $("#HomePage").attr('href');
    console.log("OrgNextPage = " + OrgNextPage);

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    console.log("urlParams = " + urlParams);
    RemoveToKeepConfirmValue = StrRemoveToKeepConfirm + "false";
    RemoveValidatePromptValue = StrRemoveValidatePrompt + "false";
    var FetchCookies = true;
    if (urlParams.get('RemoveToKeepConfirm') != null && urlParams.get('RemoveToKeepConfirm') !== ""){
        FetchCookies = false;
        RemoveToKeepConfirmValue = StrRemoveToKeepConfirm + urlParams.get('RemoveToKeepConfirm');
        if (urlParams.get('RemoveToKeepConfirm') === "true")
            $( "#RemoveToKeepConfirm" ).prop("checked", true);
        else
            $( "#RemoveToKeepConfirm" ).prop("checked", false);
    }
    if (urlParams.get('RemoveValidatePrompt') != null && urlParams.get('RemoveValidatePrompt') !== ""){
        FetchCookies = false;
        RemoveValidatePromptValue = StrRemoveValidatePrompt + urlParams.get('RemoveValidatePrompt');
        console.log("RemoveValidatePromptValue = " + RemoveValidatePromptValue);
        if (urlParams.get('RemoveValidatePrompt') === "true")
            $( "#RemoveValidatePrompt" ).prop("checked", true);
        else
            $( "#RemoveValidatePrompt" ).prop("checked", false);
    }
    if (FetchCookies){
        console.log("Cookies = " + document.cookie);
        var cookies = document.cookie;
        if (cookies.indexOf(StrRemoveToKeepConfirm) > -1){
            var idx = cookies.indexOf(StrRemoveToKeepConfirm) + StrRemoveToKeepConfirm.length;
            var s = cookies.substring(idx);
            console.log("StrRemoveToKeepConfirm Cookie = " + s);
            if (s.startsWith("true"))
                $( "#RemoveToKeepConfirm" ).prop("checked", true);
            else
                $( "#RemoveToKeepConfirm" ).prop("checked", false);
        }
        if (cookies.indexOf(StrRemoveValidatePrompt) > -1){
            var idx = cookies.indexOf(StrRemoveValidatePrompt) + StrRemoveValidatePrompt.length;
            var s = cookies.substring(idx);
            console.log("StrRemoveValidatePrompt Cookie = " + s);
            if (s.startsWith("true"))
                $( "#RemoveValidatePrompt" ).prop("checked", true);
            else
                $( "#RemoveValidatePrompt" ).prop("checked", false);
        }
    }
    SetPaginateButtonChange();
  $("button").click(function(){
    var Mode = this.value;
    var ActionID = this.id;
	if (Mode === "DoNothing")
		return;
	if (ActionID === "AdvanceMenu" || ActionID === "AdvanceMenu_")
    {
		var newUrl = window.location.href;
		newUrl = newUrl.replace(/report\/DuplicateTagScenes[_0-9]*.html/g, "advance_options.html?GQL=" + GraphQl_URL + "&apiKey=" + apiKey);
		window.open(newUrl, "_blank");
        return;
    }
	if (Mode.startsWith("deleteScene") || Mode === "removeScene"){
		var chkBxDisableDeleteConfirm = document.getElementById("RemoveToKeepConfirm");
        question = "Are you sure you want to delete this file and remove scene from stash?";
        if (Mode !== "deleteScene" && Mode.startsWith("deleteScene")) question = "Are you sure you want to delete all the flagged files and remove them from stash?";
        if (Mode === "removeScene") question = "Are you sure you want to remove scene from stash?";
		if (!chkBxDisableDeleteConfirm.checked && !confirm(question))
			return;
        if (Mode === "deleteScene" || Mode === "removeScene"){
            $('.ID_' + ActionID).css('background-color','gray');
            $('.ID_' + ActionID).css('pointer-events','none');
        }
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
	else if (Mode.startsWith("flagScene")){
	    var flagType = Mode.substring(9);
		Mode = "flagScene";
		if (!SetFlagOnScene(flagType, ActionID))
				return;
        ActionID = ActionID + ":" + flagType;
        console.log("ActionID = " + ActionID);
    }
    RunPluginOperation(Mode, ActionID, this, true);
  });
  $("#RemoveValidatePrompt").change(function() {
    console.log("checkbox clicked");
    SetPaginateButtonChange();
  });
  $("#RemoveToKeepConfirm").change(function() {
    SetPaginateButtonChange();
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
<td>
    <div class="dropdown">
        <button id="AdvanceMenu" name="AdvanceMenu">Menu <i class="fa fa-caret-down"></i></button>
        <div class="dropdown-content">
            <div><button id="AdvanceMenu" title="Open [Advance Duplicate File Deletion Menu] on a new tab in the browser." name="AdvanceMenu">Advance Duplicate File Deletion Menu</i></button></div>
            <div style="height:2px;width:220px;border-width:0;color:gray;background-color:gray;">_</div>
            <div><button type="button" id="mergeMetadataForAll" value="mergeTags" title="Merge scene metadata from [Duplicate to Delete] to [Duplicate to Keep]. This action make take a few minutes to complete.">Merge Tags, Performers, and Galleries</button></div>
            <div><button type="button" id="clear_duplicate_tags_task" value="clear_duplicate_tags_task" title="Remove duplicate (_DuplicateMarkForDeletion_?) tag from all scenes. This action make take a few minutes to complete.">Remove Scenes Dup Tags</button></div>
            <div style="height:2px;width:220px;border-width:0;color:gray;background-color:gray;">_</div>
            <div><button type="button" id="fileNotExistToDelete" value="Tagged" title="Delete tagged duplicates for which file does NOT exist.">Delete Tagged Files That do Not Exist</button></div>
            <div><button type="button" id="fileNotExistToDelete" value="Report" title="Delete duplicate candidate files in report for which file does NOT exist.">Delete Files That do Not Exist in Report</button></div>
            <div style="height:2px;width:220px;border-width:0;color:gray;background-color:gray;">_</div>
            <div><button type="button" id="clearAllSceneFlags" value="clearAllSceneFlags" title="Remove flags from report for all scenes, except for deletion flag.">Clear All Scene Flags</button></div>
            <div><button title="Delete all yellow flagged scenes in report." value="deleteSceneYellowFlag" id="yellow" style="background-color:yellow"		>Delete All Yellow Flagged Scenes</button></div>
            <div><button title="Delete all green flagged scenes in report." value="deleteSceneGreenFlag" id="green" style="background-color:#00FF00"		>Delete All Green Flagged Scenes</button></div>
            <div><button title="Delete all orange flagged scenes in report." value="deleteSceneOrangeFlag" id="orange" style="background-color:orange"		>Delete All Orange Flagged Scenes</button></div>
            <div><button title="Delete all cyan flagged scenes in report." value="deleteSceneCyanFlag" id="cyan" style="background-color:cyan"				>Delete All Cyan Flagged Scenes</button></div>
            <div><button title="Delete all pink flagged scenes in report." value="deleteScenePinkFlag" id="pink" style="background-color:pink"				>Delete All Pink Flagged Scenes</button></div>
            <div><button title="Delete all red flagged scenes in report." value="deleteSceneRedFlag" id="red" style="background-color:red"					>Delete All Red Flagged Scenes</button></div>
            <div><button title="Delete all strike-through scenes in report." value="StrikeThrough" id="line-through"								>Delete All Strike-through Scenes</button></div>
        </div>
    </div>
</td>
<td><input type="checkbox" id="RemoveValidatePrompt" name="RemoveValidatePrompt"><label for="RemoveValidatePrompt" title="Disable notice for task completion (Popup).">Disable Complete Confirmation</label><br></td>
<td><input type="checkbox" id="RemoveToKeepConfirm" name="RemoveToKeepConfirm"><label for="RemoveToKeepConfirm" title="Disable confirmation prompts for delete scenes">Disable Delete Confirmation</label><br></td>

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
