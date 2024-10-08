import { Component, OnInit, Input, EventEmitter, Output, Renderer2, ElementRef } from '@angular/core';
import { IOptions } from 'src/app/shared/interface';


@Component({
  selector: 'highlight-custom-selector',
  templateUrl: './highlight-custom-selector.component.html',
  styleUrls: ['./highlight-custom-selector.component.css']
})
export class HighlightCustomComponent implements OnInit {
  private _originalSelectors: IOptions[] = [];
  private _visible:true|false = false;
  wordStates: IOptions[] = [];
  isValueSelected:true|false = false;


  @Input() set selectors(value: IOptions[] | null) {
    console.log("Received at Highlight custom component");
    console.log(value);
    
    this.wordStates = value ? value.map(item => ({ ...item })) : [];
    this._originalSelectors = value ? value.map(item => ({ ...item })) : [];
  }

  get selectors(): IOptions[] | null {
    return this.wordStates;
  }

  @Input()
  set visible(value:true|false){
    this._visible = value;
  }

  get visible():true|false{
    return this._visible;
  }

  @Output() options: EventEmitter<IOptions[] | null> = new EventEmitter<IOptions[] | null>();

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnInit(): void {
    this.initializeEventListeners();
  }

  initializeEventListeners(): void {
    const container = this.el.nativeElement.querySelector('.highlight-container');
    if (container) {
      this.renderer.listen(container, 'mouseup', (e: MouseEvent) => this.handleSelection(e));
    }
  }

  handleSelection(e: MouseEvent): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const container = this.el.nativeElement.querySelector('.highlight-container');
    const startWord = this.getWordIndex(container, range.startContainer, range.startOffset);
    const endWord = this.getWordIndex(container, range.endContainer, range.endOffset);

    this.updateWordStates(startWord, endWord);
  }

  getWordIndex(container: Node, targetNode: Node, targetOffset: number): number {
    const spans = this.el.nativeElement.querySelectorAll('span');
    for (let i = 0; i < spans.length; i++) {
      if (spans[i].contains(targetNode)) {
        return i;
      }
    }
    return -1;
  }

  updateWordStates(startWord: number, endWord: number): void {
    for (let i = startWord; i <= endWord; i++) {
      this.wordStates[i].isSelected = !this.wordStates[i].isSelected;
      if (!this.wordStates[i].isSelected) {
        this.wordStates[i].isCorrect = false;
      }
    }
    this.updateSelectors();
    this.emitSelectors();
    this.isValueSelectedFunc();
  }

  updateSelectors(): void {
    if (!this.wordStates) { return; }
  
    let newSelectors: IOptions[] = [];
    let currentGroup: IOptions[] = [];
  
    for (let wordState of this.wordStates) {
      if (wordState.isSelected) {
        currentGroup.push(wordState);
      } else {
        if (currentGroup.length > 0) {
          newSelectors.push(this.mergeWordStates(currentGroup));
          currentGroup = [];
        }
        newSelectors.push(wordState);
      }
    }
  
    if (currentGroup.length > 0) {
      newSelectors.push(this.mergeWordStates(currentGroup));
    }
  
    this.wordStates = newSelectors;
  }
  
  mergeWordStates(group: IOptions[]): IOptions {
    return {
      word: group.map(w => w.word).join(' '),
      isSelected: group[0].isSelected,
      isCorrect: group[0].isCorrect
    };
  }

  emitSelectors(): void {
    this.options.emit([...this.wordStates]);
  }


  toggleSelection(index: number): void {
    if (index < 0 || index >= this.wordStates.length) return;

    const currentWord = this.wordStates[index];
    if (currentWord.isSelected) {
      // If the word is currently selected, we need to split it
        const originalWords = this.getOriginalWords(currentWord.word);
        this.wordStates.splice(index, 1, ...originalWords);
      }else{
        this.wordStates[index].isSelected = !this.wordStates[index].isSelected;
        this.wordStates[index].isCorrect = this.wordStates[index].isSelected ? this.wordStates[index].isCorrect : false;
      } 

    this.options.emit(this.wordStates);
  }
  getOriginalWords(mergedWord: string): IOptions[] {
    const words = mergedWord.split(/(\s+)/)
    .map(word => word.trim())
    .filter(word => word.length > 0);

    return words.map(word => {
      const originalWord = this._originalSelectors.find(w => w.word === word);
      return {
        word: word,
        isSelected: false,
        isCorrect: originalWord ? originalWord.isCorrect : false
      };
    });
  }

  isValueSelectedFunc():void{
    this.wordStates.map((w)=>{
        if(w.isSelected){
          this.isValueSelected = true;
          return;
      }
    });
    this.isValueSelected = false;
  }

  resetClick():void{
    const selectedStates = this.wordStates
    .filter(w => w.word.trim() !== '')
    .filter(w=>w.isSelected);
    if(selectedStates.length === 0){
      alert("No value is selected");
      return;
    }
    this.wordStates
    .filter(w => w.word.trim() !== '')
    .map(w=>{
      w.isSelected = false;
      w.isCorrect = false;  
    });
    this.options.emit(this.wordStates);
  }
}
