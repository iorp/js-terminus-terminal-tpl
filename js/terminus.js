// todo bringg to js proto 
Object.prototype.deepMerge = function (obj) {
    
    return Object.keys(obj).reduce((merged, key) =>
      ({
        ...merged,
        [key]:
          typeof obj[key] === 'object' && !Array.isArray(obj[key]) && this[key]
            ? this[key].deepMerge(obj[key])
            : obj[key],
      }),
      { ...this }
    );
  };
  /* 
   Example usage:
  var obj1 = {
    a: 1,
    b: {
      c: 2,
    },
  };
  
  var obj2 = {
    b: {
      d: 3,
    },
    e: 4,
  };
  
  var mergedObject = obj1.deepMerge(obj2);
  console.log(mergedObject);
  */
  

window.Terminus={
    extensions:{},
    /**
          * Plugin constructor
          * @param {Node} element
          * @param {Object} [options]
          * @api public
          */
    Plugin:class  {
        constructor(element,options){
            this.element = element;
            this.options = {
                editor:{
                    pointerCharacter:'>', 
                    mode: 'javascript',
                    theme: 'default',
                    lineNumbers: true, 
                    }
            }.deepMerge(options);
           
    
            this.init();
        }
     
    init(){
        

        
        document.addEventListener("DOMContentLoaded",  () =>{
        window.test =  new window.Terminus.Plugin(document.getElementById('terminal'),{});

          this.rules = this.logic.fn.getRules();
           // Initialize CodeMirror Editor for the console
           this.editor.fn.init();
            
    
    
             this.commandHistory = [];
            this.historyIndex = -1;
            console.log(this.options)
            this.statementPrefix = 'term'+this.options.editor.pointerCharacter;
            // Initial message
            this.editor.fn.appendOutput('Welcome to Terminus! Enter JavaScript commands below and press Enter to execute.', false);
            this.editor.fn.readyForStatement();
        });
        } 


    logic={
     fn:{
        getRules(){
            // Retrieve all rules from all extensions   
            let rules = {};
            // iterate extensions 
            Object.keys(window.Terminus.extensions).forEach(extName => {
            // iterate extension rules
            (window.Terminus.extensions[extName].rules||[]).forEach(rule => {
            
                rule.extension = window.Terminus.extensions[extName];
                if(rules[rule.name]!=undefined) console.warn('Terminus extensions warning, rules overlap');
                
                rules[rule.name] = rule;
                 
            });
            
            });
            return rules;
            }
     }
    } 

    editor={
      
        fn : { 
            init:()=>{
                var functionNames =Object.keys(this.rules);
                var customFunctionList = Object.values(this.rules);
            
                let editorFn = this.editor.fn; 

                let nativeEditorOptions = { 
                    autofocus: true,
                    extraKeys: {
                        "Ctrl-A":   (cm)=> {
                             var startLineNumber = cm.fn.getLastStatementLineNumber();
                            // Get the last line and its length
                            var lastLineNumber = cm.lastLine();
                            var lastLine = cm.getLine(lastLineNumber);
                            var lastLineLength = lastLine.length;
                            // Set the selection from the specified starting point to the end
                            cm.setSelection({ line: startLineNumber, ch: this.statementPrefix.length }, { line: lastLineNumber, ch: lastLineLength });
                          },
                        "Ctrl-Space": function (cm) {
                            CodeMirror.showHint(cm, function (cm, options) {
                                console.log('show hint')
                              var cursor = cm.getCursor();
                              var token = cm.getTokenAt(cursor);
                              var start = token.start;
                              var end = cursor.ch;
                  
                              // Get the current word
                              var currentWord = token.string;
                              
                              // Filter the function names based on the current word
                              var suggestions = functionNames.filter(function (name) {
                                return name.startsWith(currentWord);
                              }); 
                              console.log(functionNames,suggestions)
                              // Create custom HTML elements for each suggestion
                              var hintList = suggestions.map(function (name) {
                                var matchingFunction = customFunctionList.find(function (func) {
                                  return func.name === name;
                                });
                                 
                                return {
                                  text: name,
                                  displayText: name,
                                  render: function (element, self, data) {
                                
                                    element.innerHTML = `<div style="padding:4px;"><strong> ${ name}</strong> - ${matchingFunction.description}</div>`;
                                  },
                                };
                              });
                  
                              return {
                                list: hintList,
                                from: CodeMirror.Pos(cursor.line, start),
                                to: CodeMirror.Pos(cursor.line, end),
                              };
                            });
                          },
                       
                        'Ctrl-Enter': this.runStatement, // Use Ctrl+Enter to run commands
                        Up: ()=>{this.navigateCommandHistory(-1)},
                        Down: ()=>{this.navigateCommandHistory(1)}
                    }};

         
                this.editor = CodeMirror(this.element, Object.assign(nativeEditorOptions,this.options.editor));
                this.editor.fn = editorFn;
    
    
    
            },
            appendOutput:(content, newLine = true) =>{
            const currentContent = this.editor.getValue();
            const newContent = `${currentContent}${newLine ? '\n' : ''}${content}`;
            this.editor.setValue(newContent);
            this.editor.focus();
            this.editor.lastResponseLine=this.editor.lastLine(); 
            this.editor.fn.moveCursorToLastCharacter();
            },
            replaceLastStatement:(replacement)=> {
                    // Get the last line number
                    const lastLineNumber = this.editor.lineCount() - 1;
        
                    // Get the content of the last line
                    const lastLine = this.editor.getLine(lastLineNumber);
        
                    // Calculate the start and end positions for the last line
                    const startPos = { line: lastLineNumber, ch: this.statementPrefix.length };
                    const endPos = { line: lastLineNumber, ch: lastLine.length };
        
                    // Replace the content of the last line with your new text
                    this.editor.replaceRange(replacement, startPos, endPos);
                },
       
            lockStatementPrefix:(editor, lineNumber)=> {
                    editor.off("beforeChange");
                    editor.on("beforeChange",   (instance, changeObj)=> {
                      if (changeObj.from.line === lineNumber) {
                        // Check if the change is within the first N characters of the line
                        
                        if ( changeObj.from.ch < this.statementPrefix.length) {
                          // Cancel the change by preventing the default behavior
                          changeObj.cancel();
                        } else {
                         
                         // Allow the change
                        }
                      }
                    //  lock all the previous lines too if not running
     
                      if (!this.running && (changeObj.from.line < this.editor.lastResponseLine || changeObj.from.line < this.editor.lastResponseLine)) {
         
                        changeObj.cancel();
                    }
                    });
                  },
          
            readyForStatement:()=>{
                    this.editor.fn.appendOutput(this.statementPrefix);
                    this.editor.fn.moveCursorToLastCharacter();  
                    this.editor.fn.lockStatementPrefix(this.editor,this.editor.getCursor().line);
                },
            moveCursorToLastCharacter:() =>{
                    const doc = this.editor.getDoc();
                    const lastLine = doc.lastLine();
                    const lastLineLength = doc.getLine(lastLine).length;
                    doc.setCursor({ line: lastLine, ch: lastLineLength });
                },
                getLastStatement:()=> {
                    var lines = this.editor.getValue().split('\n').reverse();
                    var statement = lines.find(line => line.startsWith(this.statementPrefix)) || '';
                    return statement.replace(this.statementPrefix, '');
                  },
                  getLastStatementLineNumber: () => {
                    const lines = this.editor.getValue().split('\n').reverse();
                    const lineIndex = lines.findIndex(line => line.startsWith(this.statementPrefix));
                    return lineIndex >= 0 ? this.editor.lastLine() - lineIndex : -1;
                  }
                
        
            }
    }
    
     
    runStatement = async  ()=>{
         this.running = true;
         //  this.editor.off("beforeChange");
                 const lastStatement =this.editor.fn.getLastStatement();
                const commands = lastStatement.split('~').map(command => command.trim());
    
            
                this.editor.fn.appendOutput(`...`, false);
                
                this.commandHistory.unshift(lastStatement);
                this.historyIndex = -1;
    
                await this.executeCommands(commands);


                this.editor.fn.readyForStatement();
            this.running=false;
    
            };
      
    executeCommands =async   (commands)=> {
                for (const command of commands) {
                    try {
                        const result = await this.simulateAsyncOperation(command);
                        this.editor.fn.appendOutput(result);
                    } catch (error) {
                        this.editor.fn.appendOutput(`Error: ${error.message}`);
                    }
                }
            }
    simulateAsyncOperation(command) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const randomValue = Math.random().toFixed(2);
                    let result =`'${command}': ${randomValue}`;
                    resolve(result);
                }, 1000); // Simulate a 1-second delay
            });
        }
    
        navigateCommandHistory(direction) {
        
              //  return () => {
              
                    if (direction === -1 && this.historyIndex < this.commandHistory.length - 1) {
                        this.historyIndex++;
                    } else if (direction === 1 && this.historyIndex >= 0) {
                        this.historyIndex--;
                    }
    
                    if (this.historyIndex >= 0) {
                        console.log(this.commandHistory[this.historyIndex]);
                        this.editor.fn.replaceLastStatement(this.commandHistory[this.historyIndex]);
                    } else {
                        this.editor.fn.replaceLastStatement('');
                    }
              //  };
            }
    
         
         
      
    
    },
       
    Extension:class{
        constructor(url){
           this.location = new URL(url);
           this.name =  url.split('/').slice(-2, -1)[0];
    
           
           window.Terminus.extensions[ this.name]=this;
        }
        
    
    }
    };



// (function ($) {
//     'use strict';
 

// // Global stuff
 

//     $.fn['Terminus'] = function (options) {
        
           
//       return this.each(function () {
 
//        let plugin=  new window.Terminus.Plugin(this,options);
  
//       });
//     };
//   }(jQuery));
