import React, { useEffect } from "react";

type Props = {
	text?: string;
	variant?: "overlay" | "toast";
	onClose?: () => void;
	children?: React.ReactNode;
};

export function Message({ text, variant = "toast", onClose, children }: Props) {
	useEffect(() => {
		if (variant === "toast") {
			const onDocClick = () => onClose && onClose();
			document.addEventListener("click", onDocClick);
			const t = setTimeout(() => onClose && onClose(), 5000);
			return () => {
				document.removeEventListener("click", onDocClick);
				clearTimeout(t);
			};
		}
	}, [variant, onClose]);

	if (variant === "overlay") {
		return (
			<div className="overlay">
				<div className="overlay-card">
					{children ? children : <div>{text}</div>}
				</div>
			</div>
		);
	}

	// toast
	return (
		<div className="message-toast" onClick={() => onClose && onClose()}>
			{text}
		</div>
	);
}
