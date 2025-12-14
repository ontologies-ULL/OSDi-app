import React from "react";

export default function ObjectPropertySelector({ label, value, onChange, options, onCreate }) {
	return (
		<div className="flex gap-2">
			<select
				className="border border-gray-900 p-2 rounded text-gray-900 flex-1"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			>
				<option value="">{label}</option>
				{options.map(opt => (
					<option key={opt.iri} value={opt.iri}>
						{opt.label || opt.iri}
					</option>
				))}
			</select>

			<button
				onClick={onCreate}
				className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
			>
				+ Create
			</button>
		</div>
	);
}
