/*

    Enamel : A fancy word for NML - New Markup Language

    Prototype Stage

    By Shivank Kacker

    Work in progress

*/
const enamel = {
    element_identifier : "__enamel",
    element_dev_identifier : "__enamel_dev",
    load : function(url, cacheName){
        $.ajax({
            async: false,
            type: 'GET',
            cache: false,
            url: url+'.nml',
            success: function(data) {
               enamel.cache[cacheName] = data;
            }
        });
    },
    lastRefreshData : [],
    lastParseData : [],
    checkRefresh: (url) => {
        const newId = enamel.newId();
        let flag = false;
        $.ajax({
            async: false,
            type: 'GET',
            cache: false,
            url: url+'.nml',
            success: function(data) {
                if(enamel.lastRefreshData[url] != data){
                    enamel.lastRefreshData[url] = data;
                    enamel.cache[newId] = data;
                    flag = true;
                }
            }
        });
        if(flag){
            return enamel.parse(enamel.cache[newId]);
        }
        
    },
    createSandBox: () => {
        const aID = enamel.sandBoxID;
        $('body').append(`
            <div id="${aID}" style="display:none;">
            </div>
        `);
        return true;
    },
    terminateSandBox: () => {
        $(`#${enamel.sandBoxID}`).remove();
        return true;
    },
    sandBoxID : '__enamelSandBox',
    cache : {},
    parsed : {},
    parsedKeys : [],
    indentation : {
        space : ' ',
        spaceNum : 4, 
        indent : function(){
            return enamel.indentation.space.repeat(enamel.indentation.spaceNum)
        }
    },
    parse : function(data){
        let divideLB = data.split(`\r\n`);
        let lastLevel = 0;
        let lastEleID = '';
        enamel.createSandBox();
        divideLB.forEach((l, li) => {
            //$('body').append(l);
            let indent = enamel.indentation.indent();
            let spaceNum = enamel.indentation.spaceNum;
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

            const eleID = enamel.newId(); //Giving each node a unique ID

            let toAppend = ``;
            if(l.startsWith(indent.repeat(inLevel)+':')){ //New Element
                
                let eString = l.split(':')[1];
                let element = eString.split(' ')[0];
                let props = l.split(element+' ')[1];
                let cont = {};

                if(typeof props == 'undefined'){
                    props = '';
                }
                
                enamel.shortElements.forEach(s => {
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
                
                let parsedProps = enamel.parseProps(props);

                appendEle = {
                    "__element" : element,
                    "__properties" : parsedProps,
                    "__content" : cont,
                    "__level" : inLevel
                };

                toAppend = `
                    <${appendEle.__element} ${appendEle.__properties} __enamelID = ${eleID} __enamelLevel = ${inLevel}>

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
                toAppend = `<span __enamelID="${eleID}" __enamelString>${appendEle.__content}</span>`;
            }

            enamel.parsed[eleID] = appendEle;

            
            if(lastEleID == ''){
                $(`#${enamel.sandBoxID}`).append(toAppend);
                lastEleID = eleID;
            }else{
                let lastEle = $(`[__enamelID = "${lastEleID}"]`);

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
        let sandBox = $(`#${enamel.sandBoxID}`);
        let sand = sandBox.html();
        
        sandBox.find('[__enamelID]').each(function(){
            if($(this).is('span') && $(this).hasAttr('__enamelString')){
                const strCont = $(this).html();
                let eID = $(this).attr('__enamelID');
                //console.log(strCont);
                //console.log(sandBox.html());
                sandBox.html(sand.replace(`<span __enamelid="${eID}" __enamelstring="">${strCont}</span>`,strCont));
            }
        });
        sandBox.find('[__enamelID]').each(function(){
            $(this).removeAttr('__enamelID').removeAttr('__enamelLevel').removeAttr('undefined').removeAttr('__enamelString');
        });


        
        sand = sandBox.html();
        enamel.terminateSandBox();
        return sand;
    },
    get: function(fName){
        const newId = enamel.newId();
        enamel.load(fName,newId);
        return enamel.parse(enamel.cache[newId]);  
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
            property : '__enamel_templated_element',
        },
        {
            identifier : '/',
            property : '__enamel_template_element',
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

        enamel.customStyleProperties.forEach(e => {
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
    const identifier = enamel.element_identifier;
    const dev_identifier = enamel.element_dev_identifier;
    const dev_elements = $(`[${dev_identifier}]`);
    setInterval(() => {
        dev_elements.each(function(){
            let url = $(this).attr(dev_identifier);
            $(this).html(
                enamel.checkRefresh(url)
            );   
        });
    }, 100);

    
    $(`[${identifier}]`).each(function(){
        let url = $(this).attr(identifier);
        $(this).html(
            enamel.get(url)
        );   
    });
    
    if(dev_elements.length){
        console.warn('You are fetching enamel components in dev mode. This is not suitable for production. Change the "__enamel_dev" attribute to "__enamel" to use for production');
    }
});