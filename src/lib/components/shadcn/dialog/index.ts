import Root from './dialog.svelte';
import Trigger from './dialog-trigger.svelte';
import Overlay from './dialog-overlay.svelte';
import Content from './dialog-content.svelte';
import Header from './dialog-header.svelte';
import Body from './dialog-body.svelte';
import Footer from './dialog-footer.svelte';
import Title from './dialog-title.svelte';
import Description from './dialog-description.svelte';
import Close from './dialog-close.svelte';

export { Root, Trigger, Overlay, Content, Header, Body, Footer, Title, Description, Close };
export {
	Root as Dialog,
	Trigger as DialogTrigger,
	Overlay as DialogOverlay,
	Content as DialogContent,
	Header as DialogHeader,
	Body as DialogBody,
	Footer as DialogFooter,
	Title as DialogTitle,
	Description as DialogDescription,
	Close as DialogClose,
};
export type { DialogTone } from './dialog-variants.js';
export { DIALOG_TONE_OPTIONS, dialogEyebrowColors } from './dialog-variants.js';
