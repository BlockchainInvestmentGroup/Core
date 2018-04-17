var config = {
        container: "#OrganiseChart1",
        rootOrientation:  'WEST', // NORTH || EAST || WEST || SOUTH
        // levelSeparation: 30,
        siblingSeparation:   20,
        subTeeSeparation:    60,
        scrollbar: "fancy",
        
        connectors: {
            type: 'step'
        },
        node: {
            HTMLclass: 'treenode'
        }
    },
    user1 = {
        text: {
            name: "user1",
        },
        HTMLid: "user1"
    },

    user11 = {
        parent: user1,
        text:{
            name: "user11",
        },
        HTMLid: "user11"
    },
    user111 = {
        parent: user11,
        text:{
            name: "user111",
        },
        HTMLid: "user111"
    },
    user112 = {
        parent: user11,
        text:{
            name: "user112",
        },
        HTMLid: "user112"
    },
    user12 = {
        parent: user1,
        text:{
            name: "user12",
        },
        HTMLid: "user12"
    },
    user121 = {
        parent: user12,
        text:{
            name: "user121",
        },
        HTMLid: "user121"
    },
    user122 = {
        parent: user12,
        text:{
            name: "user122",
        },
        HTMLid: "user122"
    },
    user13 = {
        parent: user1,
        text:{
            name: "user13",
        },
        HTMLid: "user13"
    }

    ALTERNATIVE = [
        config,
        user1,
        user11,
        user111,
        user112,
        user12,
        user121,
        user122,
        user13,
    ];