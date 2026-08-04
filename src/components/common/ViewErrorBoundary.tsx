import React, { Component } from 'react';

interface Props { children: React.ReactNode; viewKey: string; onBack: () => void }
interface State { error: Error | null }

export class ViewErrorBoundary extends Component<Props,State> {
  declare readonly props: Readonly<Props>;
  declare setState: (state: State | ((previous: State) => State)) => void;
  state:State={error:null};
  static getDerivedStateFromError(error:Error){return{error}}
  componentDidUpdate(previous:Props){if(previous.viewKey!==this.props.viewKey&&this.state.error)this.setState({error:null})}
  render(){if(!this.state.error)return this.props.children;return <div className="p-6"><div className="mx-auto mt-16 max-w-lg rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:bg-slate-900"><h2 className="text-lg font-bold">Não foi possível abrir esta tela</h2><p className="my-3 text-sm text-slate-500">O restante do sistema continua funcionando. Volte ao painel e tente novamente.</p><button onClick={()=>{this.setState({error:null});this.props.onBack()}} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white">Voltar ao painel</button></div></div>}
}
