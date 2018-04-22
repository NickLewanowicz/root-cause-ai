import Component from '@ember/component';
import { computed } from '@ember/object';
//import { A } from '@ember/array';

import moment from 'moment';

export default Component.extend({
    computeToast: false,
    editEdge: false,
    recompute: false,
    pathDetails: false,
    numNodes: 10,
    branching: 2,

    nodes: computed( 'model', function() {
        let nodes = []
        for( let i = this.get('numNodes'); i > 0; i--){
            nodes.push({"id": i.toString()})
        }
        return nodes
    }),

    edges: computed( 'nodes', function() {
        const branching = this.get('branching')
        const numNodes = this.get('numNodes')

        let edges = []
        let usedPairs = new Set()
        for(let i = 0; i < branching*numNodes; i++){
            let source = i % numNodes
            let target = (Math.floor(Math.random() * numNodes) + 1 )
            while(usedPairs.has(source + '-' + target) || source == target){
                target = (Math.floor(Math.random() * numNodes) + 1 )
            }
            usedPairs.add(source + '-' + target)
            
            edges.push({'id': source + '-' + target ,'label': source + '-' + target, source, target, 'data': 0})
        }
        this.send('updateRoot', edges[0])
        return edges
    }),
    
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
    allPaths: computed( 'root', function() {
        const startTime = moment.now()
        let iterations = 0
        
        const edges = this.get('edges')
        const root = this.get('root')
        const startNode = root.source
        const endNode = root.target

        let open = []
        let paths = []
        let curr = [startNode] //Not sure if needed

        while(curr != null){
            for(let j = 0; j < edges.length; j++){
                if(edges[j].source == curr[curr.length-1] && edges[j].target != startNode &&  !curr.includes(edges[j].target)){
                    let newPath = curr.concat(edges[j].target)
                    if(edges[j].target == endNode && edges[j].target != startNode && paths.toString().indexOf(curr.toString()) < 0){
                        paths[paths.length] = newPath.copy()
                    }else{
                        open[open.length] = newPath.copy()
                    }
                }else if(edges[j].target == curr[curr.length-1] && edges[j].source != startNode && !curr.includes(edges[j].source)){
                    let newPath = curr.concat(edges[j].source)
                    if(edges[j].source == endNode && paths.toString().indexOf(curr.toString()) < 0){
                        paths[paths.length] = newPath.copy()
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
        this.setStats({'time': (moment.now() - startTime) /1000, 'iterations': iterations})
        return paths.sort(function(a, b) { return a.length - b.length})
    }),

    /* 
     * Description: Array of objects representing all paths from startNode to endNode
     * Complexity: Linear time complexity
     * Purpose: This will be triggered with updates to the allPaths, purpose is to generate goodness scores for paths 
    */
    computedPaths: computed( 'allPaths', function() {
        const allPaths = this.get('allPaths')
        const objectMap = this.get('objectMap')
        const root = this.get('root')
        let computedPaths = []

        for(const path of allPaths){
            let computedPath = []
            let firstPath = objectMap.get(path[0] + '-' + path[1]) || objectMap.get(path[1] + '-' + path[0])
            for(let i = 0; i< firstPath.data.length; i++){
                for(let j in firstPath.data[i].metrics){
                    for(let k in firstPath.data[i].metrics[j]){
                        if(firstPath.data[i].metrics[j][k] != 0 && root) {
                            //firstPath.data[i].metrics[j][k] = firstPath.data[i].metrics[j][k]/root.data[i].metrics[j][k]  || 0
                        }
                    }
                }
            }
            computedPath.push({
                'label': path[0], 
                'data': firstPath
            })
            for(let i = 1; i <path.length; i++){
                let nextPath =  objectMap.get(path[i-1] + '-' + path[i]) || objectMap.get(path[i] + '-' + path[i-1])
                for(let i = 0; i< nextPath.data.length; i++){
                    for(let j in nextPath.data[i].metrics){
                        for(let k in nextPath.data[i].metrics[j]){
                            if(nextPath.data[i].metrics[j][k] != 0 && root && root.data[i].metrics[j][k] != 0) {
                                //nextPath.data[i].metrics[j][k] = nextPath.data[i].metrics[j][k]/root.data[i].metrics[j][k]
                            }
                        }
                    }
                }
                computedPath.push({
                    'label': path[i], 
                    'data': nextPath
                })
            }
            
            computedPaths.push(computedPath)
            
        }
        return computedPaths
    }),

    setStats (stats) {
        let old = this.get('pathStats')
        this.set('computeToast', true)
        if(old != stats){
            this.set('pathStats', stats)
        }
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
                this.toggleProperty('recompute')
            }
            
            
        },
        toggleRecompute() {
            this.toggleProperty('recompute')
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
        }
        
    }
});
