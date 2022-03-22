/*

    Sprint

    Prototype Stage

    By Shivank Kacker

    Work in progress

*/
const sprint = {
    element_identifier : "__sprint",
    element_dev_identifier : "__sprint_dev",
    load : function(url, cacheName){
        $.ajax({
            async: false,
            type: 'GET',
            cache: false,
            url: url+'.spml',
            success: function(data) {
               sprint.cache[cacheName] = data;
            }
        });
    },
    lastRefreshData : [],
    lastParseData : [],
    checkRefresh: (url) => {
        const newId = sprint.newId();
        let flag = false;
        $.ajax({
            async: false,
            type: 'GET',
            cache: false,
            url: url+'.spml',
            success: function(data) {
                if(sprint.lastRefreshData[url] != data){
                    sprint.lastRefreshData[url] = data;
                    sprint.cache[newId] = data;
                    flag = true;
                }
            }
        });
        if(flag){
            return sprint.parse(sprint.cache[newId]);
        }
        //startRefreshes();
    },
    createSandBox: () => {
        const aID = sprint.sandBoxID;
        if($('#'+aID).length > 0){
            $('')
        }
        $('body').append(`
            <div id="${aID}" style="display:none;">
            </div>
        `);
        return true;
    },
    terminateSandBox: () => {
        $(`#${sprint.sandBoxID}`).remove();
        return true;
    },
    sandBoxID : '__sprintSandBox',
    cache : {},
    parsed : {},
    parsedKeys : [],
    indentation : {
        space : ' ',
        spaceNum : 4, 
        indent : function(){
            return sprint.indentation.space.repeat(sprint.indentation.spaceNum)
        }
    },
    parse : function(data){
        let divideLB = data.split(`\r\n`);
        let lastLevel = 0;
        let lastEleID = '';
        sprint.createSandBox();
        divideLB.forEach((l, li) => {
            //$('body').append(l);
            let indent = sprint.indentation.indent();
            let spaceNum = sprint.indentation.spaceNum;
            let preceeding = l.search(/\S/);
            if (!l.replace(/\s/g, '').length) {
                return;
            }
            
            let inLevel = preceeding / spaceNum;

            if(preceeding % spaceNum != 0){
                console.error('Parse Error: Invalid indentation on line '+ (li+1));
                return false;
            }
            let appendEle = [];

            const eleID = sprint.newId(); //Giving each node a unique ID

            let toAppend = ``;
            if(l.startsWith(indent.repeat(inLevel)+':')){ //New Element
                
                let eString = l.split(':')[1];
                let element = eString.split(' ')[0];
                let props = l.split(element+' ')[1];
                let cont = {};

                if(typeof props == 'undefined'){
                    props = '';
                }
                
                sprint.shortElements.forEach(s => {
                    if(element.includes(s.identifier)){
                        if(element.startsWith(s.identifier)){
                            props += ' '+s.property+'="'+element.replace(s.identifier, '')+'"';
                            element = 'div';
                            
                        }else{
                            let eleSplit = element.split(s.identifier);
                            props += ' '+s.property+'="'+eleSplit[1]+'"';
                            element = eleSplit[0];
                        }
                        
                        return false;
                    }
                });

                if(element == 'title'){
                    cont = props; 
                    props = '';
                }
                
                let parsedProps = sprint.parseProps(props);

                appendEle = {
                    "__element" : element,
                    "__properties" : parsedProps,
                    "__content" : cont,
                    "__level" : inLevel
                };

                toAppend = `
                    <${appendEle.__element} ${appendEle.__properties} __sprintID = ${eleID} __sprintLevel = ${inLevel}>

                    </${appendEle.__element}>
                `;

            }else{ //Is string
                let cont = l.replace(indent.repeat(inLevel),'');
                appendEle = {
                    "__element" : "string",
                    "__properties" : '',
                    "__content" : cont,
                    "__level" : inLevel
                };
                toAppend = `<span __sprintID="${eleID}" __sprintString>${appendEle.__content}</span>`;
            }

            sprint.parsed[eleID] = appendEle;

            
            if(lastEleID == ''){
                $(`#${sprint.sandBoxID}`).append(toAppend);
                lastEleID = eleID;
            }else{
                let lastEle = $(`[__sprintID = "${lastEleID}"]`);

                if(lastLevel < inLevel){ //Is a child element
                    lastEle.append(toAppend);
                    lastEleID = eleID;

                }else if(lastLevel > inLevel){ //Is a parent element
                    let pointer = lastEle.parent();
                    let diff = lastLevel - inLevel;
                    for(i = 0; i < diff; i++){
                        pointer = pointer.parent();
                    }
                    pointer.append(toAppend);
                    lastEleID = eleID;
                }else{ //Is in the same heirarchy
                    lastEle.parent().append(toAppend);
                    lastEleID = eleID;
                }

            }

            lastLevel = inLevel;
            
        });
        let sandBox = $(`#${sprint.sandBoxID}`);
        let sand = sandBox.html();
        
        sandBox.find('[__sprintID]').each(function(){
            if($(this).is('span') && $(this).hasAttr('__sprintString')){
                const strCont = $(this).html();
                let eID = $(this).attr('__sprintID');
                //console.log(strCont);
                //console.log(sandBox.html());
                sandBox.html(sand.replace(`<span __sprintid="${eID}" __sprintstring="">${strCont}</span>`,strCont));
            }
        });
        sandBox.find('[__sprintID]').each(function(){
            $(this).removeAttr('__sprintID').removeAttr('__sprintLevel').removeAttr('undefined').removeAttr('__sprintString');
        });

        sand = sandBox.html();

        sprint.terminateSandBox();
        
        return sand;
    },
    get: function(fName){
        const newId = sprint.newId();
        sprint.load(fName,newId);
        return sprint.parse(sprint.cache[newId]);  
    },
    shortElements : [
        {
            identifier : '.',
            property : 'class',
        },
        {
            identifier : '#',
            property : 'id',
        },
        {
            identifier : '<',
            property : '__sprint_templated_element',
        },
        {
            identifier : '/',
            property : '__sprint_template_element',
        }
    ],
    newId : function(){
        return Math.random().toString(16).slice(2);
    },
    parseProps : (props) => {
        if(props == ''){
            return props;
        }
        
        //Magic part begins
        const regex = /([^\r\n\t\f\v= '"]+)(?:=(["'])?((?:.(?!\2?\s+(?:\S+)=|\2))+.)\2?)?/gm;
        const str = `<sample sample="" ${props}></sample>`;
        let m;

        let propA = [];
        let propB = [];
        let propF = [];
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                if(groupIndex == 3 || groupIndex == 1){
                    //console.log(`Found match, group ${groupIndex}: ${match}`);
                }
                if(groupIndex == 1){
                    propA.push(match);
                }else if(groupIndex == 3){
                    propB.push(match);
                }
                
            });
        }
        propA.forEach((e,i) => {
            if(i == 0 || i==1 || i == (propA.length - 1)){
                return;
            }
            let property = e;
            let value = propB[i];
            propF[property] = value;
        });
        
        //magic part ends

        //console.log(propF);

        var hasStyle = checkValue(propF.style);
        if(hasStyle){
            if(propF.style != '' && propF.style.endsWith(";") == false){
                propF.style += ';';
            }
            
        }else{
            propF.style = '';
        }

        sprint.customStyleProperties.forEach(e => {
            if(checkValue(propF[e.prop])){
               
                //console.log(propF.style);
                //console.log(e.sval);
                propF.style += e.sval + ":" + propF[e.prop] + ';';
                delete propF[e.prop];
            }
        });

        //console.log(propF);

        let propString = '';

        if(propF.style == ''){
            delete propF.style;
        }
        for (var key in propF) {
            let val = propF[key];
            propString += key + '=' + '"'+ val +'" ';
        }

        //console.log(propString);
        return propString;
    },
    customStyleProperties : [
        {
            "prop" : "color",
            "sval" : "color"
        },
        {
            "prop" : "font-size",
            "sval" : "font-size"
        },
        {
            "prop" : "bg",
            "sval" : "background"
        },
        {
            "prop" : "height",
            "sval" : "height" 
        },
        {
            "prop" : "width",
            "sval" : "width" 
        }
    ]
}

let checkValue = (val) => (typeof val != 'undefined');

$.fn.hasAttr = function(name) {  
    return this.attr(name) !== undefined;
};

$(window).on('load',()=>{
    const identifier = sprint.element_identifier;
    const dev_identifier = sprint.element_dev_identifier;
    const dev_elements = $(`[${dev_identifier}]`);

    
    $(`[${identifier}]`).each(function(){
        let url = $(this).attr(identifier);
        $(this).html(
            sprint.get(url)
        );   
    });
    
    if(dev_elements.length){
        console.warn('You are fetching Sprint components in dev mode. This is not suitable for production. Change the "__sprint_dev" attribute to "__sprint" to use for production');
    }

    startRefreshes();
});

const startRefreshes = () => {
    setInterval(() => {
        let dev_identifier = sprint.element_dev_identifier;
        let dev_elements = $(`[${dev_identifier}]`).not('[__sprint_init]');
        dev_elements.each(function(){
            let url = $(this).attr(dev_identifier);
            //$(this).attr('__sprint_init','');
            $(this).html(
                sprint.checkRefresh(url)
            );

        });
    }, 100);   
}