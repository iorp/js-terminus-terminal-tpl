  new class extends Terminus.Extension{

    rules=[
        {name:'consoleLog',fn:()=>{this.fn.log(...args)},args:{arg0:'a',arg1:'b'},description:'Log test'},
    
    ];
   fn={
        log:(...args)=>{
            console.log(...args)
        }
        }
        
         
}(import.meta.url);

export default {}