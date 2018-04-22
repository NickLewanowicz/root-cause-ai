import Component from '@ember/component';
import { computed } from '@ember/object';
//import { A } from '@ember/array';

import moment from 'moment';

export default Component.extend({
    // /* 
    //  * Description: Root signature is the 'cause signature' we are going to be comparing all other paths to
    //  * Complexity: constant time
    //  * Purpose: Not sure if this is 100% necessary as of now
    // */
    // rootSignature: computed('startNode', 'endNode', function() {
    //      const startNode = this.get('startNode')
    //      const endNode = this.get('endNode')

    //      const rootEdge = this.get('objectMap').get(startNode + '-' + endNode)

    //     for(const )
    //     }),

    /* 
     * Description: Map of edge id's and data to be querried by computedPaths
     * Complexity: linear time to construct
     * Purpose: This is meant to allow contant time access to this information
    */
    objectMap: computed( 'model', function() {
        const edges = this.get('model')
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
    allPaths: computed( 'model', 'root', function() {
        const startTime = moment.now()
        let iterations = 0
        
        const edges = this.get('model')
        const root = this.get('root') || this.get('objectMap').get('0-1')
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
        return paths.sort(function(a, b) { return a.length - b.length || a.localeCompare(b)})
    }),

    /* 
     * Description: Array of objects representing all paths from startNode to endNode
     * Complexity: Linear time complexity
     * Purpose: This will be triggered with updates to the allPaths, purpose is to generate goodness scores for paths 
    */
    computedPaths: computed( 'allPaths', function() {
        const allPaths = this.get('allPaths')
        const objectMap = this.get('objectMap')
        let computedPaths = []

        for(const path of allPaths){
            let computedPath = []
            computedPath.push({
                'label': path[0], 
                'data': objectMap.get(path[0] + '-' + path[1]) || objectMap.get(path[1] + '-' + path[0])
            })
            for(let i = 1; i <path.length; i++){
                computedPath.push({
                    'label': path[i], 
                    'data': objectMap.get(path[i-1] + '-' + path[i]) || objectMap.get(path[i] + '-' + path[i-1])
                })
            }
            computedPaths.push(computedPath)

        }
        console.log(computedPaths)
        return computedPaths
    }),

    setStats (stats) {
        let old = this.get('pathStats')
        if(old != stats){
            this.set('pathStats', stats)
        }
    },

    actions: {
        updateRoot (item) {
            this.set('root', item)
        }
    }
});
