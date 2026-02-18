var globalRoadmapData = null;

function generateRoadmap(){

var role = document.getElementById("role").value.trim();
var education = document.getElementById("education").value.trim();
var duration = document.getElementById("duration").value.trim();

if(!role || !education || !duration){
alert("Please fill all fields");
return;
}

var timeline = document.getElementById("timeline");

/* CLEAR + LOADING */
timeline.innerHTML = "<div class='loading'>Generating Roadmap...</div>";

fetch("/roadmapgenerator/",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
role:role,
current_education:education,
duration:duration
})
})
.then(function(response){
if(!response.ok){
throw new Error("Server error");
}
return response.json();
})
.then(function(data){

/* REMOVE LOADING */
timeline.innerHTML = "";

var roadmap;

/* HANDLE STRING OR OBJECT */
if(data.roadmap && typeof data.roadmap === "string"){
try{
var cleaned = data.roadmap
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();
roadmap = JSON.parse(cleaned);
}catch(e){
timeline.innerHTML = "<div class='loading'>Invalid JSON format.</div>";
return;
}
}else{
roadmap = data.roadmap || data;
}

/* RENDER PHASES */
if(roadmap.phases && Array.isArray(roadmap.phases)){

roadmap.phases.forEach(function(phase){

var item = document.createElement("div");
item.className = "timeline-item";

var learningHTML = "";
if(Array.isArray(phase.learning_points)){
phase.learning_points.forEach(function(point){
learningHTML += "<li>"+point+"</li>";
});
}

var projectHTML = "";
if(Array.isArray(phase.projects)){
phase.projects.forEach(function(project){
projectHTML +=
"<div class='inner-card'>" +
"<h4>"+project.title+"</h4>" +
"<p>"+project.description+"</p>" +
"</div>";
});
}

var resourceHTML = "";
if(Array.isArray(phase.resources)){
phase.resources.forEach(function(resource){
resourceHTML +=
"<div class='inner-card'>" +
"<a href='"+resource.link+"' target='_blank'>" +
resource.title +
"</a>" +
"</div>";
});
}

item.innerHTML =
"<div class='timeline-dot'></div>" +
"<div class='timeline-card'>" +
(phase.days_count ? "<div class='days-badge'>"+phase.days_count+" Days</div>" : "") +
"<h2 class='phase-title'>"+phase.phase_name+"</h2>" +
"<div class='section'><h3>Learning Points</h3><ul>"+learningHTML+"</ul></div>" +
"<div class='section'><h3>Projects</h3>"+projectHTML+"</div>" +
"<div class='section'><h3>Resources</h3>"+resourceHTML+"</div>" +
"</div>";

timeline.appendChild(item);

});

}

/* RENDER MARKET OPPORTUNITIES */
if(roadmap["Market Opportunities"]){

var market = roadmap["Market Opportunities"];
var marketItem = document.createElement("div");
marketItem.className = "timeline-item";

var rolesHTML = "";
if(Array.isArray(market.expected_roles)){
market.expected_roles.forEach(function(role){
rolesHTML += "<li>"+role+"</li>";
});
}

var salaryHTML = "";
if(Array.isArray(market.salaries)){
market.salaries.forEach(function(salary){
if(typeof salary === "object"){
salaryHTML += "<li>$"+salary.min+" - $"+salary.max+"</li>";
}else{
salaryHTML += "<li>"+salary+"</li>";
}
});
}

var companyHTML = "";
if(Array.isArray(market.companies)){
market.companies.forEach(function(company){
companyHTML += "<li>"+company+"</li>";
});
}

var linkHTML = "";
if(Array.isArray(market.opportunity_links)){
market.opportunity_links.forEach(function(link){
linkHTML +=
"<div class='inner-card'>" +
"<a href='"+link.link+"' target='_blank'>" +
link.title +
"</a>" +
"</div>";
});
}

marketItem.innerHTML =
"<div class='timeline-dot'></div>" +
"<div class='timeline-card market-card'>" +
"<h2 class='phase-title'>Market Opportunities</h2>" +
"<div class='section'><h3>Expected Roles</h3><ul>"+rolesHTML+"</ul></div>" +
"<div class='section'><h3>Salaries</h3><ul>"+salaryHTML+"</ul></div>" +
"<div class='section'><h3>Companies</h3><ul>"+companyHTML+"</ul></div>" +
"<div class='section'><h3>Opportunity Links</h3>"+linkHTML+"</div>" +
"</div>";

timeline.appendChild(marketItem);

}


globalRoadmapData = roadmap;
document.getElementById("downloadBtn").style.display = "inline-block";

  
})
.catch(function(error){
timeline.innerHTML = "<div class='loading'>Something went wrong.</div>";
console.error("Error:", error);
});

}











function downloadRoadmap(){

if(!globalRoadmapData){
alert("Generate roadmap first.");
return;
}

const { jsPDF } = window.jspdf;
var doc = new jsPDF();

var y = 10;

doc.setFontSize(16);
doc.text("AI Career Roadmap", 10, y);
y += 10;

if(globalRoadmapData.phases){

globalRoadmapData.phases.forEach(function(phase){

doc.setFontSize(14);
doc.text(phase.phase_name + " (" + phase.days_count + " Days)", 10, y);
y += 8;

doc.setFontSize(11);

if(phase.learning_points){
phase.learning_points.forEach(function(point){
var splitText = doc.splitTextToSize("- " + point, 180);
doc.text(splitText, 12, y);
y += splitText.length * 6;
});
}

y += 4;

if(phase.projects){
doc.text("Projects:", 12, y);
y += 6;

phase.projects.forEach(function(project){
var splitText = doc.splitTextToSize(
project.title + ": " + project.description, 170
);
doc.text(splitText, 14, y);
y += splitText.length * 6;
});
}

y += 4;

if(phase.resources){
doc.text("Resources:", 12, y);
y += 6;

phase.resources.forEach(function(resource){
var splitText = doc.splitTextToSize(
resource.title + " - " + resource.link, 170
);
doc.text(splitText, 14, y);
y += splitText.length * 6;
});
}

y += 10;

if(y > 270){
doc.addPage();
y = 10;
}

});

}

doc.save("AI_Roadmap.pdf");

}




