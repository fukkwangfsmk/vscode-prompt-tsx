/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation and GitHub. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import type { Command, Location, ProviderResult, Range, ThemeIcon, Uri } from './standalone-types';
import { MarkdownString } from './standalone-types';

/**
 * Represents a part of a chat response that is formatted as Markdown.
 */
export class ChatResponseMarkdownPart {
	/**
	 * A markdown string or a string that should be interpreted as markdown.
	 */
	value: MarkdownString;

	/**
	 * Create a new ChatResponseMarkdownPart.
	 *
	 * @param value A markdown string or a string that should be interpreted as markdown.
	 */
	constructor(value: string | MarkdownString) {
		this.value = typeof value === 'string' ? new MarkdownString(value) : value;
	}
}

/**
 * Represents a file tree structure in a chat response.
 */
export interface ChatResponseFileTree {
	/**
	 * The name of the file or directory.
	 */
	name: string;

	/**
	 * An array of child file trees, if the current file tree is a directory.
	 */
	children?: ChatResponseFileTree[];
}

/**
 * Represents a part of a chat response that is a file tree.
 */
export class ChatResponseFileTreePart {
	/**
	 * File tree data.
	 */
	value: ChatResponseFileTree[];

	/**
	 * The base uri to which this file tree is relative
	 */
	baseUri: Uri;

	/**
	 * Create a new ChatResponseFileTreePart.
	 * @param value File tree data.
	 * @param baseUri The base uri to which this file tree is relative.
	 */
	constructor(value: ChatResponseFileTree[], baseUri: Uri) {
		this.value = value;
		this.baseUri = baseUri;
	}
}

/**
 * Represents a part of a chat response that is an anchor, that is rendered as a link to a target.
 */
export class ChatResponseAnchorPart {
	/**
	 * The target of this anchor.
	 */
	value: Uri | Location;

	/**
	 * An optional title that is rendered with value.
	 */
	title?: string;

	/**
	 * Create a new ChatResponseAnchorPart.
	 * @param value A uri or location.
	 * @param title An optional title that is rendered with value.
	 */
	constructor(value: Uri | Location, title?: string) {
		this.value = value;
		this.title = title;
	}
}

/**
 * Represents a part of a chat response that is a progress message.
 */
export class ChatResponseProgressPart {
	/**
	 * The progress message
	 */
	value: string;

	/**
	 * Create a new ChatResponseProgressPart.
	 * @param value A progress message
	 */
	constructor(value: string) {
		this.value = value;
	}
}

/**
 * Represents a part of a chat response that is a reference, rendered separately from the content.
 */
export class ChatResponseReferencePart {
	/**
	 * The reference target.
	 */
	value: Uri | Location;

	/**
	 * The icon for the reference.
	 */
	iconPath?:
		| Uri
		| ThemeIcon
		| {
				/**
				 * The icon path for the light theme.
				 */
				light: Uri;
				/**
				 * The icon path for the dark theme.
				 */
				dark: Uri;
		  };

	/**
	 * Create a new ChatResponseReferencePart.
	 * @param value A uri or location
	 * @param iconPath Icon for the reference shown in UI
	 */
	constructor(
		value: Uri | Location,
		iconPath?:
			| Uri
			| ThemeIcon
			| {
					/**
					 * The icon path for the light theme.
					 */
					light: Uri;
					/**
					 * The icon path for the dark theme.
					 */
					dark: Uri;
			  }
	) {
		this.value = value;
		this.iconPath = iconPath;
	}
}

/**
 * Represents a part of a chat response that is a button that executes a command.
 */
export class ChatResponseCommandButtonPart {
	/**
	 * The command that will be executed when the button is clicked.
	 */
	value: Command;

	/**
	 * Create a new ChatResponseCommandButtonPart.
	 * @param value A Command that will be executed when the button is clicked.
	 */
	constructor(value: Command) {
		this.value = value;
	}
}

/**
 * Represents the different chat response types.
 */
export type ChatResponsePart =
	| ChatResponseMarkdownPart
	| ChatResponseFileTreePart
	| ChatResponseAnchorPart
	| ChatResponseProgressPart
	| ChatResponseReferencePart
	| ChatResponseCommandButtonPart;

export interface ChatDocumentContext {
	uri: Uri;
	version: number;
	ranges: Range[];
}
