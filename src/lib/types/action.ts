export interface Action {
	id: string;
	dashboard_id: string | null;
	name: string;
	icon: string | null;
	command_template: string;
	sort_order: number;
	visible: boolean;
}

export interface CreateActionRequest {
	dashboard_id?: string | null;
	name: string;
	icon?: string | null;
	command_template: string;
	sort_order?: number;
	visible?: boolean;
}

export interface UpdateActionRequest {
	id: string;
	name?: string;
	icon?: string | null;
	command_template?: string;
	sort_order?: number;
	visible?: boolean;
}
