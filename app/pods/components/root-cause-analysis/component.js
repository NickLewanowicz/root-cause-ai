import Component from '@ember/component';
import { computed } from '@ember/object';
//import { timeout } from 'ember-concurrency';
//import { A } from '@ember/array';

import moment from 'moment';

export default Component.extend({
    computeToast: false,
    editEdge: false,
    recompute: false,
    regenGraph: true,
    pathDetails: false,
    numNodes: 20,
    branching: 1.5,

    generateNodes() {
        let nodes = []
        for( let i = this.get('numNodes'); i > 0; i--){
            nodes.push({"id": i.toString()})
        }
        this.set('nodes',nodes)
    },

    generateEdges() {
        const branching = this.get('branching')
        const numNodes = this.get('numNodes')

        let edges = []
        let usedIds = new Set()
        for(let i = 0; i < branching*numNodes; i++){
            let source = (i % numNodes) + 1
            let target = (Math.floor(Math.random() * numNodes) + 1 )
            while(usedIds.has(source + '-' + target) || usedIds.has(target + '-' + source) || source == target){
                target = (Math.floor(Math.random() * numNodes) + 1 )
            }

            usedIds.add(source + '-' + target)
            
            edges.push({'id': source + '-' + target ,'label': source + '-' + target, source, target, 'data': ((Math.round((Math.random() * 1)*10))/1000)})
        }
        this.send('updateRoot', edges[0])
        this.set('edges', edges)
    },
    
    /* 
     * Description: Map of edge id's and data to be querried by computedPaths
     * Complexity: linear time to construct
     * Purpose: This is meant to allow contant time access to this information
    */
    objectMap: computed( 'edges', function() {
        const edges = this.get('edges')
        let objectMap = new Map()
        for(const edge of edges){
            objectMap.set(edge.id, edge)
        }
        return objectMap
    }),

    /* 
     * Description: 2D array of all paths that connect startNode and endNode
     * Complexity: Exponential time complexity (doesnt scale)
     * Purpose: This is meant to allow comparison from the heuristic based solution to caclulate successfull root cause analysis
    */
    genAllPaths() {
        const startTime = moment.now()
        let iterations = 0
        
        const edges = this.get('edges')
        const root = this.get('root')
        const startNode = root.source
        const endNode = root.target

        let open = []
        let paths = []
        let pathObjects = []
        let curr = [startNode] //Not sure if needed

        while(curr != null){
            for(let j = 0; j < edges.length; j++){
                if(edges[j].source == curr[curr.length-1] && edges[j].target != startNode &&  !curr.includes(edges[j].target)){
                    let newPath = curr.concat(edges[j].target)
                    if(edges[j].target == endNode && edges[j].target != startNode && paths.toString().indexOf(curr.toString()) < 0){
                        paths[paths.length] = newPath.copy()
                        pathObjects.push({path: newPath.copy(), degredationVariance: Math.abs(this.calcDegredation(newPath) - root.data)})
                    }else{
                        open[open.length] = newPath.copy()
                    }
                }else if(edges[j].target == curr[curr.length-1] && edges[j].source != startNode && !curr.includes(edges[j].source)){
                    let newPath = curr.concat(edges[j].source)
                    if(edges[j].source == endNode && paths.toString().indexOf(curr.toString()) < 0){
                        paths[paths.length] = newPath.copy()
                        pathObjects.push({path: newPath.copy(), degredationVariance: Math.abs(this.calcDegredation(newPath) - root.data)})
                    }else{
                        open[open.length] = newPath.copy()
                    }
                }
                iterations++
            }
            if(open.length > 0){
                curr = open.pop()
            }else{
                curr = null
            }
        }
        console.log(pathObjects)
        this.setStats({'time': (moment.now() - startTime) /1000, 'iterations': iterations})
        this.set('allPaths', pathObjects.sort(function(a, b) { return a.degredationVariance - b.degredationVariance}))
    },
    possibleMoves(curr) {
        
    },
    calcDegredation(path){
        const root = this.get('root')
        const startNode = root.source
        const endNode = root.target
        const objectMap = this.get('objectMap')
        let degredation = 0
        for(let i = 1; i < path.length; i++){
            let edge = objectMap.get(path[i-1] + "-" + path[i]) || objectMap.get(path[i] + "-" + path[i-1])
            degredation += edge.data
        }
        return degredation
    },
    genBestPaths() {
        const startTime = moment.now()
        let iterations = 0
        
        const root = this.get('root')
        const startNode = root.source
        const endNode = root.target
        const adjacencyList = this.getAdjacencyList(this.get('edges'))
        const objectMap = this.get('objectMap')

        let open = new Map([[0, [[startNode]]]])
        let closestKey = 0
        let closed = new Set()
        let foundPaths = []
        let foundSet = new Set()
        let paths = []
        let curr = [startNode] //Not sure if needed
        while (iterations<5000)  {
            let newMoves = Array.from(adjacencyList[curr[curr.length-1]])

            while(newMoves.length > 0){
                let move = newMoves.pop()         
                if(!curr.includes(move)){
                    let edge = objectMap.get(curr[curr.length-1] + '-' + move) || objectMap.get(move + '-' + curr[curr.length-1])
                    if(move == endNode && !foundSet.has(curr.concat(move).toString())){
                        foundPaths.push({path: curr.concat(move), degredationVariance: Math.abs(edge.data + closestKey - root.data)})
                        foundSet.add(curr.concat(move).toString())
                    }else{
                        if(open.has(edge.data + closestKey)) {
                            open.get(edge.data + closestKey).push(curr.concat(move))
                        }else{
                            open.set(edge.data + closestKey, [curr.concat(move)])
                        }
                    }
                }
                iterations++
            }
            //console.log(open)
            let keys = Array.from(open.keys())
            closestKey = keys[0]
            for(let x = 0; x < keys.length; x++) {
                if(Math.abs(root.data - keys[x]) < Math.abs(root.data - closestKey)){
                    closestKey = keys[x]
                }
            }
            if(open.get(closestKey) == undefined){
                debugger
            }
            curr = open.get(closestKey).pop()
            if(open.get(closestKey).length == 0){
                open.delete(closestKey)
            }
            
        }       
        //this.setStats({'time': (moment.now() - startTime) /1000, 'iterations': iterations})
        this.set('heuristicPaths', foundPaths.sort(function(a, b) { return a.degredationVariance - b.degredationVariance}))
        this.setHeuristicStats({'time': (moment.now() - startTime) /1000, 'iterations': iterations})
    },

    getAdjacencyList(edges) {
        let list = new Array(this.numNodes)
        for(const edge of edges){
            console.log(edge)
            if(list[parseInt(edge.source)] == undefined){
                list[parseInt(edge.source)] = new Set()
            }    
            
            if(list[parseInt(edge.target)] == undefined){
                list[parseInt(edge.target)] = new Set()
            }
            list[parseInt(edge.source)].add(parseInt(edge.target))
            list[parseInt(edge.target)].add(parseInt(edge.source))
        }
        return list 
    },

    /* 
     * Description: Array of objects representing all paths from startNode to endNode
     * Complexity: Linear time complexity
     * Purpose: This will be triggered with updates to the allPaths, purpose is to generate goodness scores for paths 
    */
    genComputedPaths() {
        const allPaths = this.get('allPaths')
        const objectMap = this.get('objectMap')
        const root = this.get('root')
        let computedPaths = []

        for(const path of allPaths){
            let computedPath = []
            let firstPath = objectMap.get(path[0] + '-' + path[1]) || objectMap.get(path[1] + '-' + path[0])
            let sum = 0
            for(let i = 0; i< firstPath.length; i++){
                sum += firstPath.data
            }
            computedPath.push({
                'label': path[0], 
                'data': firstPath.data,
                'sum': sum
            })

            for(let i = 1; i < path.length; i++){
                let nextPath =  objectMap.get(path[i-1] + '-' + path[i]) || objectMap.get(path[i] + '-' + path[i-1])
                
                computedPath.push({
                    'label': path[i], 
                    'data': nextPath
                })
            }
            
            computedPaths.push(computedPath)
            
        }
        this.set('computedPaths', computedPaths) 
    },

    createEvent() {
        let allPaths = this.get('allPaths')
        let root = this.get('root')

        for(let i = 0; i<allPaths.length; i++){
            debugger
        }
    },

    setStats (stats) {
        let old = this.get('pathStats')
        this.set('computeToast', true)
        if(old != stats){
            this.set('pathStats', stats)
        }
    },
    setHeuristicStats (stats) {
        let old = this.get('hPathStats')
        this.set('computeToast', true)
        if(old != stats){
            this.set('hPathStats', stats)
        }
    },
    init() {
        this._super(...arguments)
        this.generateNodes()
        this.generateEdges()
        this.genAllPaths()
        this.genBestPaths()
    },

    actions: {
        updateRoot (item) {
            this.set('root', item)
            
        },
        openModal(item) {
            this.set('editingEdge', item)
            this.toggleProperty('editEdge')

        },
        closeModal(item, action) {
            //This is just to force the CP to recompute
            item.type = item.type == 'arrow' ? 'line' : 'arrow'
            this.toggleProperty('editEdge')
            let edges = this.get('edges')
            if(action == 'save'){
                for(let i = 0; i<edges.length; i++){
                    if(edges[i].label === item.label){
                        this.set('edges'+ [i],item)
                    }
                }
                this.genAllPaths()
                this.genComputedPaths()
            }
        },
        toggleRecompute() {
            this.genAllPaths()
            this.genComputedPaths()
        },
        togglePathDetails(selectedItem) {
            this.set('selectedItem', selectedItem)
            this.toggleProperty('pathDetails')
        },
        toggleToast() {
            this.toggleProperty('computeToast')
        },
        edgeAdded(edge) {
            return edge
        },
        regenGraph() {
            this.set('nodes', '')
            this.set('edges', '')
            this.generateNodes()
            this.generateEdges()
            this.genAllPaths()
            this.genComputedPaths()
        }
        
    }
});
