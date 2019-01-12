var diameter = 960,
    radius = diameter / 2,
    innerRadius = radius - 250;

var cluster = d3.cluster()
    .size([360, innerRadius]);

var informationDiv = document.getElementById("proj_desc")

var line = d3.radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(function(d) {  return d.y; })
    .angle(function(d) {  return d.x / 180 * Math.PI; });

var svg2 = d3.select("#legend").append("svg")
    .attr("width", 220)
    .attr("height", 40)
    .append('text')
    .text("something");

var svg = d3.select(".mainSvg").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

var link = svg.append("g").selectAll(".link"),
    link2 = svg.append("g").selectAll(".link2"),
    node = svg.append("g").selectAll(".node"),
    circle = svg.append("g").selectAll(".circle");

var svgWidth = 500;
var svgHeight = 100;
    bigLabels = svg.append("g").attr("id", "Labels");
    bigLabels.append("text")
                    .text("Faculty")
                    .attr("x", -48)
                    .attr("y", -160)
                    .attr("transform", "rotate(-21, 0, 0)")
                    .attr("fill", "#315ea2")
                    .attr("class","bigLabel");
    bigLabels.append("text")
                    .text("Department")
                    .attr("x", -100)
                    .attr("y", 160)
                    .attr("transform", "rotate(62, 0, 0)")
                    .attr("fill", "#287a4d")
                    .attr("class","bigLabel");
    bigLabels.append("text")
                    .text("Student")
                    .attr("x", -75)
                    .attr("y", 160)
                    .attr("transform", "rotate(268, 0, 0)")
                    .attr("fill", "#da4c31")
                    .attr("class","bigLabel");

d3.json("sample_revised.json", function(error, classes) {
  if (error) throw error;

  var root = packageHierarchy(classes)
      .sum(function(d) {
      //  console.log(d.size);
        return d.size; });

  cluster(root);
  
  link = link
    .data(packageImports(root.leaves()))
    .enter().append("path")
      .each(function(d) { d.source = d[0], d.target = d[d.length - 1];
//	 console.log(d);
	})
      .attr("class", "link")
      .attr("d", line)

  link2 = link2
    .data(packageImports2(root.leaves()))
    .enter().append("path")
      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "link2")
      .attr("d", line);

  node = node
    .data(root.leaves())
    .enter().append("text")
      .attr("class", function(d) { if (d.value == 1) {
                                      return "node1"  } else if (d.value == 2) {
                                      return "node2" } else if (d.value == 3) {
                                      return "node3" } else {
                                      return "node"  }
                                 })
      .attr("dy", "0.3em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 18) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) { return d.data.key; })
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);

  var color_blue = "#315ea2";
  var color_green = "#287a4d";
  var color_red = "#da4c31";
  
  circle = circle.data(root.leaves())
                 .enter().append("circle")
                 .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
                 .attr("cx", 0 )
                 .attr("cy", 0 )
                 .attr("r", 5)
                 .attr("fill", function(d) { 
                    if (d.value == 1) { return color_blue}
                                              else if (d.value == 2) { return color_green}
                                              else if (d.value == 3) { return color_red}
                                              else { return "black"}
                                            })
                 .attr("opacity", function(d) { if (d.value < 5) {return 1} else {return 0}} );

//mouse event
function mouseovered(d) {
  d3.select("text").style("cursor", "pointer");

  var CEETeam = $(".chart");
  CEETeam.css( "display", "block" );
  informationDiv.innerHTML =  d.data.description;

  if(d.value == 2){
    CEETeam.css( "display", "none" );
  }else{
    if(d.data.rect1 == 0){
      $("#rect1").css("fill","transparent");
    }else{
      $("#rect1").css("fill","#315EA2");
    }
    if(d.data.rect2 == 0){
      $("#rect2").css("fill","transparent");
    }else{
      $("#rect2").css("fill","#315EA2");
    }
  }

  node
      .each(function(n) { n.target = n.source = false; });

  link
      .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
      .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
      .filter(function(l) { return l.target === d || l.source === d; })
      .raise();
      

  node
      .classed("node--target", function(n) { return n.target; })
      .classed("node--source", function(n) { return n.source; });

  link2
      .classed("link2--target", function(l) { if (l.target.source === true && l.source.target === true) return true; })
      .raise();

}

function mouseouted(d) {
  link
      .classed("link--target", false)
      .classed("link--source", false);

  link2
      .classed("link2--target", false)
      .classed("link2--source", false);

  node
      .classed("node--target", false)
      .classed("node--source", false);
  }

});



// Lazily construct the package hierarchy from class names.
function packageHierarchy(classes) {
  var map = {};

  function find(name, data) {
    var node = map[name], i;
    if (!node) {
      node = map[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  }

  classes.forEach(function(d) {
    find(d.name, d);
  });

  return d3.hierarchy(map[""]);
}

// Return a list of imports for the given array of nodes.
function packageImports(nodes) {
  var map = {},
      imports = [];

  // Compute a map from name to node.
  nodes.forEach(function(d) {
    map[d.data.name] = d;
  });

  // For each import, construct a link from the source to target node.
  nodes.forEach(function(d) {
    if (d.data.imports) d.data.imports.forEach(function(i) {
      imports.push(map[d.data.name].path(map[i]));
    });
  });

  return imports;
}

function packageImports2(nodes) {
  var map = {},
      test = [];

  // Compute a map from name to node.
  nodes.forEach(function(d) {
    map[d.data.name] = d;
  });

  // For each import, construct a link from the source to target node.
  nodes.forEach(function(d) {
    if (d.data.exports) d.data.exports.forEach(function(i) {
      test.push(map[d.data.name].path(map[i]));
    });
  });

  return test;
}