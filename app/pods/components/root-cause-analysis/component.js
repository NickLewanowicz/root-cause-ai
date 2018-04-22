import Component from '@ember/component';
import { computed } from '@ember/object';

import moment from 'moment';

export default Component.extend({
    startNode: 0,
    endNode: 1,

    allPaths: computed( 'model', function() {
        const startTime = moment.now()
        let iterations = 0

        const edges = this.get('model')
        const startNode = this.get('startNode')
        const endNode = this.get('endNode')

        let open = []
        let paths = []
        let curr = [startNode] //Not sure if needed

        while(curr != null){
            for(let j = 0; j < edges.length; j++){
                if(edges[j].source == curr[curr.length-1] && !curr.includes(edges[j].target)){
                    let newPath = curr.concat(edges[j].target)
                    if(edges[j].target == endNode && paths.toString().indexOf(curr.toString()) < 0){
                        paths[paths.length] = this.dup(newPath)
                    }else{
                        open[open.length] = this.dup(newPath)
                    }
                }else if(edges[j].target == curr[curr.length-1] && !curr.includes(edges[j].source)){
                    let newPath = curr.concat(edges[j].source)
                    if(edges[j].source == endNode && paths.toString().indexOf(curr.toString()) < 0){
                        paths[paths.length] = this.dup(newPath)
                    }else{
                        open[open.length] = this.dup(newPath)
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

        return paths
    }),

    setStats (stats) {
        this.set('pathStats', stats)
    }
});
