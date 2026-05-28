import { render } from 'preact';
import { App } from '../options/App';
import '../options/global.css';

const root = document.getElementById('app');
if (root) render(<App />, root);
