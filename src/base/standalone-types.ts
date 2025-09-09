/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation and GitHub. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * Standalone types to replace VS Code dependencies for standalone usage
 */

/**
 * A cancellation token is passed to an asynchronous or long running
 * operation to request cancellation.
 */
export interface CancellationToken {
	/**
	 * Is `true` when the token has been cancelled, `false` otherwise.
	 */
	isCancellationRequested: boolean;

	/**
	 * An event which fires upon cancellation.
	 */
	onCancellationRequested: Event<any>;
}

/**
 * Represents a typed event.
 */
export interface Event<T> {
	/**
	 * A function that represents an event to which you subscribe by calling it with
	 * a listener function as argument.
	 */
	(listener: (e: T) => any, thisArgs?: any, disposables?: any[]): any;
}

/**
 * A cancellation source creates and controls a cancellation token.
 */
export class CancellationTokenSource {
	private _token: CancellationToken;
	private _isCancelled = false;
	private _listeners: Array<(e: any) => any> = [];

	constructor() {
		this._token = {
			isCancellationRequested: false,
			onCancellationRequested: (listener: (e: any) => any) => {
				this._listeners.push(listener);
				return {
					dispose: () => {
						const index = this._listeners.indexOf(listener);
						if (index >= 0) {
							this._listeners.splice(index, 1);
						}
					},
				};
			},
		};
	}

	get token(): CancellationToken {
		return this._token;
	}

	cancel(): void {
		if (!this._isCancelled) {
			this._isCancelled = true;
			(this._token as any).isCancellationRequested = true;
			this._listeners.forEach(listener => listener(undefined));
		}
	}

	dispose(): void {
		this.cancel();
		this._listeners = [];
	}
}

/**
 * Represents a line and character position, such as the position of the cursor.
 */
export class Position {
	/**
	 * The zero-based line value.
	 */
	readonly line: number;

	/**
	 * The zero-based character value.
	 */
	readonly character: number;

	/**
	 * @param line A zero-based line value.
	 * @param character A zero-based character value.
	 */
	constructor(line: number, character: number) {
		this.line = line;
		this.character = character;
	}

	/**
	 * Check if this position is before `other`.
	 */
	isBefore(other: Position): boolean {
		return this.line < other.line || (this.line === other.line && this.character < other.character);
	}

	/**
	 * Check if this position is equal to `other`.
	 */
	isEqual(other: Position): boolean {
		return this.line === other.line && this.character === other.character;
	}
}

/**
 * A range represents an ordered pair of two positions.
 */
export class Range {
	/**
	 * The start position. It is before or equal to end.
	 */
	readonly start: Position;

	/**
	 * The end position. It is after or equal to start.
	 */
	readonly end: Position;

	/**
	 * Create a new range from two positions. If `start` is not
	 * before or equal to `end`, the values will be swapped.
	 */
	constructor(start: Position, end: Position);
	/**
	 * Create a new range from number coordinates.
	 */
	constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number);
	constructor(
		startLineOrStart: number | Position,
		startCharacterOrEnd: number | Position,
		endLine?: number,
		endCharacter?: number
	) {
		if (
			typeof startLineOrStart === 'number' &&
			typeof startCharacterOrEnd === 'number' &&
			endLine !== undefined &&
			endCharacter !== undefined
		) {
			this.start = new Position(startLineOrStart, startCharacterOrEnd);
			this.end = new Position(endLine, endCharacter);
		} else {
			this.start = startLineOrStart as Position;
			this.end = startCharacterOrEnd as Position;
		}

		// Ensure start is before or equal to end
		if (this.start.isBefore(this.end) || this.start.isEqual(this.end)) {
			// All good
		} else {
			// Swap
			const temp = this.start;
			(this as any).start = this.end;
			(this as any).end = temp;
		}
	}

	/**
	 * `true` if `start` and `end` are equal.
	 */
	get isEmpty(): boolean {
		return this.start.isEqual(this.end);
	}

	/**
	 * `true` if `start.line` and `end.line` are equal.
	 */
	get isSingleLine(): boolean {
		return this.start.line === this.end.line;
	}
}

/**
 * A universal resource identifier representing either a file on disk
 * or another resource.
 */
export class Uri {
	/**
	 * Scheme is the `http` part of `http://www.example.com/some/path?query#fragment`.
	 */
	readonly scheme: string;

	/**
	 * Authority is the `www.example.com` part of `http://www.example.com/some/path?query#fragment`.
	 */
	readonly authority: string;

	/**
	 * Path is the `/some/path` part of `http://www.example.com/some/path?query#fragment`.
	 */
	readonly path: string;

	/**
	 * Query is the `query` part of `http://www.example.com/some/path?query#fragment`.
	 */
	readonly query: string;

	/**
	 * Fragment is the `fragment` part of `http://www.example.com/some/path?query#fragment`.
	 */
	readonly fragment: string;

	private constructor(
		scheme: string,
		authority: string,
		path: string,
		query: string,
		fragment: string
	) {
		this.scheme = scheme;
		this.authority = authority;
		this.path = path;
		this.query = query;
		this.fragment = fragment;
	}

	/**
	 * Create an URI from a string, e.g. `http://www.example.com/some/path`.
	 */
	static parse(value: string, strict?: boolean): Uri {
		const match = value.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
		if (!match) {
			if (strict) {
				throw new Error(`Invalid URI: ${value}`);
			}
			return new Uri('', '', value, '', '');
		}

		return new Uri(match[2] || '', match[4] || '', match[5] || '', match[7] || '', match[9] || '');
	}

	/**
	 * Create an URI from a file system path.
	 */
	static file(path: string): Uri {
		return new Uri('file', '', path.replace(/\\/g, '/'), '', '');
	}

	/**
	 * The string representing the corresponding file system path of this Uri.
	 */
	get fsPath(): string {
		if (this.scheme !== 'file') {
			return this.path;
		}
		return this.path;
	}

	/**
	 * Returns a string representation of this Uri.
	 */
	toString(skipEncoding?: boolean): string {
		let result = '';
		if (this.scheme) {
			result += this.scheme + ':';
		}
		if (this.authority) {
			result += '//' + this.authority;
		}
		if (this.path) {
			result += this.path;
		}
		if (this.query) {
			result += '?' + this.query;
		}
		if (this.fragment) {
			result += '#' + this.fragment;
		}
		return result;
	}
}

/**
 * A reference to a named icon.
 */
export class ThemeIcon {
	/**
	 * The id of the icon.
	 */
	readonly id: string;

	/**
	 * Creates a reference to a theme icon.
	 */
	constructor(id: string) {
		this.id = id;
	}
}

/**
 * Represents a reference to a command.
 */
export interface Command {
	/**
	 * Title of the command, like `save`.
	 */
	title: string;

	/**
	 * The identifier of the actual command handler.
	 */
	command: string;

	/**
	 * A tooltip for the command, when represented in the UI.
	 */
	tooltip?: string;

	/**
	 * Arguments that the command handler should be invoked with.
	 */
	arguments?: any[];
}

/**
 * A location represents a location inside a resource, such as a line inside a text file.
 */
export class Location {
	/**
	 * The resource identifier of this location.
	 */
	uri: Uri;

	/**
	 * The document range of this location.
	 */
	range: Range;

	/**
	 * Creates a new location object.
	 */
	constructor(uri: Uri, range: Range) {
		this.uri = uri;
		this.range = range;
	}
}

/**
 * The MarkdownString represents human-readable text that supports formatting via the markdown syntax.
 */
export class MarkdownString {
	/**
	 * The markdown string.
	 */
	value: string;

	/**
	 * Indicates that this markdown string is from a trusted source.
	 */
	isTrusted?: boolean;

	/**
	 * Indicates that this markdown string can contain raw html tags.
	 */
	supportHtml?: boolean;

	/**
	 * Indicates that this markdown string will be sanitized.
	 */
	supportThemeIcons?: boolean;

	/**
	 * Creates a new markdown string with the given value.
	 */
	constructor(value?: string, supportThemeIcons?: boolean) {
		this.value = value ?? '';
		this.supportThemeIcons = supportThemeIcons;
	}

	/**
	 * Appends and returns the given string to this markdown string.
	 */
	appendText(value: string): MarkdownString {
		this.value += value;
		return this;
	}

	/**
	 * Appends and returns the given string as markdown to this markdown string.
	 */
	appendMarkdown(value: string): MarkdownString {
		this.value += value;
		return this;
	}
}

/**
 * A provider result is a union type that represents different ways a provider can return results.
 */
export type ProviderResult<T> = T | undefined | null | Thenable<T | undefined | null>;

/**
 * Progress interface for reporting incremental progress.
 */
export interface Progress<T> {
	/**
	 * Report a progress update.
	 */
	report(value: T): void;
}

/**
 * Represents the role of a chat message.
 */
export enum LanguageModelChatMessageRole {
	/**
	 * The user role.
	 */
	User = 1,

	/**
	 * The assistant role.
	 */
	Assistant = 2,

	/**
	 * The system role.
	 */
	System = 3,
}

/**
 * Represents a language model chat message.
 */
export interface LanguageModelChatMessage {
	/**
	 * The role of the message sender.
	 */
	role: LanguageModelChatMessageRole;

	/**
	 * The content of the message.
	 */
	content: string;

	/**
	 * Optional name of the message sender.
	 */
	name?: string;
}

/**
 * Simple language model interface for tokenization
 */
export interface LanguageModelChat {
	/**
	 * Count the number of tokens in a message or text.
	 */
	countTokens(text: string | LanguageModelChatMessage, token?: CancellationToken): Thenable<number>;
}
