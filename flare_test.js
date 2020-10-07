var realWidth = window.innerWidth;
var realHeight = window.innerHeight;

var m = [40, 240, 40, 240],
    w = realWidth -m[0] -m[0],
    h = realHeight -m[0] -m[2],
    i = 0,
    root;

var tree = d3.layout.tree()
    .size([h, w]);


var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var vis = d3.select("#tree").append("svg:svg")
    .attr("class","svg_container")
    .attr("width", w)
    .attr("height", h)
    .style("overflow", "scroll")
  .append("svg:g")
    .attr("class","drawarea")
  .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

var botao = d3.select("#form #button");

// find position of element relative to document (used to find iframe) 
// https://stackoverflow.com/questions/5598743/finding-elements-position-relative-to-the-document
function getCoords(elem) { // crossbrowser version
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
}


d3.json("data.json", function (json) {
    root = json;
    root.x0 = h / 2;
    root.y0 = 0;

    function toggleAll(d) {
        if (d.children) {
            d.children.forEach(toggleAll);
            toggle(d);
        }
    }

    // Initialize the display to show a few nodes.
    root.children.forEach(toggleAll);
    // toggle(root.children);
    toggle(root)

    update(root);
});

function update(source) {
        //////////////////////
    // Compute the new height, function counts total children of root node and sets tree height accordingly.
    // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
    // This makes the layout more consistent.
    var levelWidth = [1];
    var childCount = function(level, n) {

        if (n.children && n.children.length > 0) {
            if (levelWidth.length <= level + 1) levelWidth.push(0);

            levelWidth[level + 1] += n.children.length;
            n.children.forEach(function(d) {
                childCount(level + 1, d);
            });
        }
    };
    childCount(0, root);
    var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line  
    tree = tree.size([newHeight, w]);

    //////////////////////////////
    var duration = d3.event && d3.event.altKey ? 5000 : 500;
    
    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse();
    console.warn(nodes)
    
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 200; });
    
    // Update the nodes…
    var node = vis.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });
    
    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        });

    nodeEnter.append("svg:circle")
        .on("click", function (d) {
            toggle(d);
            update(d);
        })
        .on("mouseover", function(d){
            if (d.children || d._children) {
                d3.select(this).classed('mouseover', true);
            }
        })
        .on("mouseout", function(d){
            d3.select(this).classed('mouseover', false);
        });

    nodeEnter.append("a")
        .attr("href", function(d){
            return d.url;
        })
        .attr("target", "iframe")
        // auto scrolls the iframe n pixels down
        // .attr("onclick", "window.scrollTo(0,1150)")
        .attr("onclick", function(d){
            if (d.url){
                // find location of iframe in page
                iframeLoc = getCoords(document.querySelector('iframe')).top
                return "window.scrollTo(0, " + iframeLoc + ")";
            }
            return null;
        })
        .append("svg:text")
        //test code, 2 lines below
        .attr("x", function(d) { 
            return d.children || d._children ? 5 : -5; })
        .attr("dx", function (d) {
            return d.children || d._children ? "-1.25em" : "1.25em"
        })
        .attr("dy", ".35em")
        .attr("text-anchor", function (d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function (d) {
            return d.name;
        })
        .style("fill-opacity", 1e-6);
    
    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
    
    //Control Radius size of node
    nodeUpdate.select("circle")
        .attr("r", "0.60em")
        .attr("class", function (d) {
            return d._children ? "with-children" : "";
        });
    
    nodeUpdate.select("text")
    .style("fill-opacity", 1);
    
    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text") 
        .style("fill-opacity", 1e-6);
    
    // Update the links…
    var link = vis.selectAll("path.link")
    .data(tree.links(nodes), function(d) { return d.target.id; });
    
    // Enter any new links at the parent's previous position.
    link.enter().insert("svg:path", "g")
    .attr("class", "link")
    .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
    })
    .transition()
    .duration(duration)
    .attr("d", diagonal);
    
    // Transition links to their new position.
    link.transition()
    .duration(duration)
    .attr("d", diagonal);
    
    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
    .duration(duration)
    .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
    })
    .remove();
    
    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
    
    d3.select("svg")
        .call(d3.behavior.zoom()
              .scaleExtent([0.5, 5])
              .on("zoom", zoom));
    
}

// Toggle children.
function toggle(d) {
    if (d.name === "GOHC") { return }
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
}

function zoom() {
    var scale = d3.event.scale,
        translation = d3.event.translate,
        tbound = -h * scale,
        bbound = h * scale,
        lbound = (-w + m[1]) * scale,
        rbound = (w - m[3]) * scale;
    // limit translation to thresholds
    translation = [
        Math.max(Math.min(translation[0], rbound), lbound),
        Math.max(Math.min(translation[1], bbound), tbound)
    ];
    d3.select(".drawarea")
        .attr("transform", "translate(" + translation + ")" +
              " scale(" + scale + ")");
}
