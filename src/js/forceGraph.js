let width = window.innerWidth - 20,
	height = window.innerHeight - 20,
	root

let force = d3.layout.force()
	.linkDistance(200)
	.charge(-1000)
	.gravity(.3)
	.linkStrength(0.5)
	.size([width, height])
	.on('tick', tick)

let svg = d3.select('body').append('svg')
	.attr('width', width)
	.attr('height', height)

let link = svg.selectAll('.link'),
	node = svg.selectAll('.node')

d3.json('src/data/graph.json', function(error, json) {
	if (error) throw error

	root = json
	update()
})

let maxSal = 0
let minSal = Number.MAX_VALUE

function update() {

	let nodes = flatten(root),
		links = d3.layout.tree().links(nodes)

	// Restart the force layout.
	force
		.nodes(nodes)
		.links(links)
		.start()

	// Update links.
	link = link.data(links, function(d) {
		return d.target.id
	})

	link.exit().remove()

	link.enter().insert('line', '.node')
		.attr('class', 'link')

	// Update nodes.
	node = node.data(nodes, function(d) {
		return d.id
	})

	node.exit().remove()

	let nodeEnter = node.enter().append('g')
		.attr('class', 'node')
		.on('click', function(d) { click(d, false) })
		.call(force.drag)

	function getChildSizeArr(node) {

		let sizeArr = []

		if (node.children) {
			node.children.forEach(function(child) {
				let childSizeArr = getChildSizeArr(child)
				sizeArr = sizeArr.concat(childSizeArr)
			})
		} else {
			sizeArr.push(node.size)
		}

		return sizeArr

	}

	function averageOfChildren(node) {

		let childArr = getChildSizeArr(node)
		let sum = childArr.reduce(function(a, b) {
			return a + b
		}, 0)
		return sum / childArr.length

	}

	nodeEnter.each(function(d) {

		if (d.size < minSal) minSal = d.size
		if (d.size > maxSal) maxSal = d.size

		let avg = averageOfChildren(d)
		d.r = avg / 2500 || 4.5
		d.avgSize = avg

		if (d.top) click(d, true)

	})

	nodeEnter.append('circle')
		.attr('r', function(d) {
			return d.r
		})

	nodeEnter.append('text')
		.attr('dy', '0em')
		.text(function(d) {
			return d.name
		})

	nodeEnter.append('text')
		.attr('dy', '1em')
		.text(function(d) {
			return '$' + d.avgSize.toFixed(0)
		})

	node.select('circle')
		.style('fill', color)
}

function tick() {
	link.attr('x1', function(d) {
			return d.source.x
		})
		.attr('y1', function(d) {
			return d.source.y
		})
		.attr('x2', function(d) {
			return d.target.x
		})
		.attr('y2', function(d) {
			return d.target.y
		})

	node.attr('transform', function(d) {
		return 'translate(' + d.x + ',' + d.y + ')'
	})
}

function color(d) {

	let normSize = (d.avgSize - minSal) / (maxSal - minSal)
	let col = d3.scale.linear()
		.domain([minSal, (maxSal + minSal) / 2, maxSal])
		.range(['#ff0000', 'white', '#24ff00'])
	return col(d.avgSize)

}

// Toggle children on click.
function click(d, ignoreEvent) {
	if (!ignoreEvent) {
		if (d3.event.defaultPrevented) return // ignore drag
	}
	if (d.children) {
		d._children = d.children
		d.children = null
	} else {
		d.children = d._children
		d._children = null
	}
	update()
}

// Returns a list of all nodes under the root.
function flatten(root) {
	let nodes = [],
		i = 0

	function recurse(node) {
		if (node.children) node.children.forEach(recurse)
		if (!node.id) node.id = ++i
		nodes.push(node)
	}

	recurse(root)
	return nodes
}

window.addEventListener('resize', function() {
	width = window.innerWidth - 20
	height = window.innerHeight - 20
	svg.attr('width', width)
		.attr('height', height)
})

window.addEventListener('selectstart', function(e) { e.preventDefault() })
