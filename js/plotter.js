var node_height=40;
var node_width=120;
var xx=300;

var m = [20, 120, 20, 120],
    w = 4280 - m[1] - m[3],
    h = 800 - m[0] - m[2] - xx,
    i = 0;

var node_depth = 200;


var tree     = d3.layout.tree().size([h, w]);
var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; })
    .source(function(d){ return {x:d.source.x, y:d.source.y+node_width}; });


var vis = d3.select("#orderflowgraph").append("svg:svg")
    .attr("width", w)
    .attr("height", h + m[0] + m[2])
    .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");


function update(source) {
    var duration = d3.event && d3.event.altKey ? 5000 : 500;

    var nodes = tree.nodes(root).reverse();

    nodes.forEach(function(d) { d.y = d.depth * node_depth; });

    var node = vis.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", function(d) { toggle(d); update(d); })
        .on("mouseover",function(d){ show_data(d);})


    nodeEnter.append("svg:rect")
        .attr("height", node_height.toString())
        .attr("width", node_width.toString())
        .attr("rx","3")
        .attr("ry","3")
        .style("fill", function(d) { return node_color(d.company,d.state) })

    nodeEnter.append("svg:text")
        .attr("x", 10)
        .attr("dy", "1.35em")
        .attr("text-anchor", "start")
        .text(function(d) { return (d.company+"-"+ d.source ); })

    nodeEnter.append("svg:text")
        .attr("x", 10)
        .attr("dy", "2.35em")
        .attr("text-anchor", "start")
        .text(function(d) { return (d.state ); })



    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + (d.x-15) + ")"; });


    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();


    var link = vis.selectAll("path.link")
        .data(tree.links(nodes), function(d) { return d.target.id; });


    link.enter().insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        })
        .attr("id",function(d){ return d.source.company + "-" + d.target.state; })

    vis.selectAll("path")
        .transition()
        .duration(duration)
        .attr("d", diagonal)
        .style("stroke-width",function(d){ return stroke_width(d.source.timestamp,d.target.timestamp)})
        .style("stroke",function(d){ return d.target.state=="cancelled" ? "#f00" : color_code_graph(d.source.timestamp,d.target.timestamp) })


    link.enter()
        .insert("svg:text", "g")
        .attr("x",function(d){ return d.source.y+node_depth-50})
        .attr("y",function(d){ return (d.source.x+ d.target.x)/2-5})
        .attr("xlink:href",function(d){ return "#" + d.source.company + "-" + d.target.state; })
        .style("font-size","9px")
        .style("stroke",function(d){ return d.target.state=="cancelled" ? "#f00" : "#aaa" })
        .style("stroke-width","0")
        .text(function(d) {
            var time_diff = (d.target.timestamp - d.source.timestamp) / 3600
            return Math.floor(time_diff * 100) / 100 + " hrs"
            //(d.target.state );
        })




    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
        })
        .remove();


    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}
function toggle(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
}
function toggleAll(d) {
    if (d.children) {
        d.children.forEach(toggleAll);
        toggle(d);
    }
}

//helpers
function stroke_width(from_date,to_date){
    var diff=(to_date-from_date)/3600

    if(diff < 2)         return "4"
    else if(diff < 5)    return "4"
    else if(diff < 10)   return "4"
    else                 return "4"
}
function color_code_graph(from_date,to_date){
    var diff=(to_date-from_date)/3600

    if(diff < 2)         return "#aaa"
    else if(diff < 5)    return "#f66"
    else if(diff < 10)   return "#a44"
    else                 return "#600"
}
function show_data(node_data){
    $(".node").mousemove(function(e){

        var obj= jQuery.parseJSON( node_data.payload );
        var info_json = JSON.stringify(obj,1,2).replace(/"/g, "")

        $(".info-float").html("<pre>" + info_json+ "</pre>")
        format_info_float(e.pageX, e.pageY)
    });
    $(".node").mouseleave(function(e){
        $(".info-float").css("display","none");
    })
}
function format_info_float(mouseX,mouseY){
    var div_height   = parseInt( $(".info-float").css("height").replace('px', ''));
    var window_height= parseInt( window.innerHeight ||  document.documentElement.clientHeight || document.body.clientHeight);
    mouseY           = parseInt( mouseY - $(window).scrollTop() );

    if(mouseY+div_height+60 > window_height) mouseY=window_height-div_height-60;
    mouseY += $(window).scrollTop();

    $(".info-float").css("display","block")
    $(".info-float").css({
        left: mouseX + 25,
        top: mouseY +25
    });
}
function node_color(company,state){
    if(company == 'b2c'){
        if(state.indexOf("cancelled")!=-1)          return "#f00"
        else if(state.indexOf("hold")!=-1)          return "#a07"
        else if(state.indexOf("res_created")!=-1)   return "#0d0"
        else                                        return "#55f"
    }
    else {
        if(state.indexOf("cancelled")!=-1)          return "#b00"
        else if(state.indexOf("hold")!=-1)          return "#a07"
        else if(state.indexOf("res_created")!=-1)   return "#0a0"
        else                                        return "#008"
    }
}





