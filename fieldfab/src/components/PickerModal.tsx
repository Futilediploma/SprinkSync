import fieldfabLogo from '../assets/field_fab.jpg';
import React, { useState } from 'react';
import ProjectsMenu from './projectsmenu';


	interface PickerModalProps {
		isOpen: boolean;
		onClose: () => void;
		onSubmit: (fields: {
			companyName: string;
			jobName: string;
			streetNumber: string;
			streetName: string;
			city: string;
			zipcode: string;
		}) => void;
		onShowProjects?: () => void;
		projects?: any[];
		onSelectProject?: (project: any) => void;
	}


const PickerModal: React.FC<PickerModalProps> = ({ isOpen, onClose, onSubmit, projects = [], onSelectProject }) => {
	const [showProjectList, setShowProjectList] = useState(false);
	const [companyName, setCompanyName] = useState('');
	const [jobName, setJobName] = useState('');
	const [streetNumber, setStreetNumber] = useState('');
	const [streetName, setStreetName] = useState('');
	const [city, setCity] = useState('');
	const [zipcode, setZipcode] = useState('');

	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	function validate() {
		const newErrors: { [key: string]: string } = {};
		if (!companyName.trim()) newErrors.companyName = 'Company name is required.';
		if (!jobName.trim()) newErrors.jobName = 'Job name is required.';
		if (!streetNumber.trim()) newErrors.streetNumber = 'Street number is required.';
		if (!streetName.trim()) newErrors.streetName = 'Street name is required.';
		if (!city.trim()) newErrors.city = 'City is required.';
		if (!zipcode.trim()) newErrors.zipcode = 'Zipcode is required.';
		else if (!/^[0-9]{5}(-[0-9]{4})?$/.test(zipcode)) newErrors.zipcode = 'Zipcode must be 5 digits or 5+4 format.';
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}

	if (!isOpen) return null;

	return (
		<div style={{
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100vw',
			height: '100vh',
			background: 'rgba(0,0,0,0.4)',
			backdropFilter: 'blur(6px)',
			zIndex: 1000,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
		}}>
			<div style={{
				background: '#fff',
				borderRadius: 12,
				padding: '16px',
				width: '90vw',
				maxWidth: '400px',
				maxHeight: '90vh',
				overflow: 'auto',
				boxShadow: '0 4px 32px #0003',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				position: 'relative',
			}}>
                        
            <img
                src={fieldfabLogo}
                alt="FieldFab logo"
                style={{ height: 80, width: 80, borderRadius: 10, marginBottom: 1, boxShadow: '0 2px 12px #0001' }}
            />  
			<h1 style={{ fontWeight: 800, fontSize: '1.75rem', margin: 0, color: '#1a2233', letterSpacing: 1 }}>FieldFab</h1>
			<div style={{ marginBottom: 8, marginTop: 4, textAlign: 'center' }}>
				<div style={{ fontWeight: 500, fontSize: 15, color: '#222' }}>Please Fill Out Form.</div>
				<button
					type="button"
					style={{
						marginTop: 8,
						background: '#1976d2',
						color: '#fff',
						border: 'none',
						borderRadius: 6,
						padding: '6px 18px',
						fontWeight: 600,
						fontSize: 15,
						cursor: 'pointer',
						boxShadow: '0 1px 4px #0001',
						transition: 'background 0.2s',
					}}
					onClick={() => setShowProjectList(true)}
				>
					Project List
				</button>
			</div>
			{showProjectList && (
				<div style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					background: 'rgba(255,255,255,0.98)',
					zIndex: 1002,
					borderRadius: 12,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
				}}>
					<ProjectsMenu
						projects={projects}
						onSelect={p => {
							setShowProjectList(false);
							if (onSelectProject) onSelectProject(p);
						}}
					/>
					<button
						style={{ marginTop: 12, padding: '6px 18px', borderRadius: 6, border: 'none', background: '#eee', fontWeight: 600 }}
						onClick={() => setShowProjectList(false)}
					>
						Cancel
					</button>
				</div>
			)}
			<h2 style={{ marginTop: 0, marginBottom: 16, fontWeight: 700, fontSize: '1.25rem' }}>Project Info</h2>
				<button
					style={{
						position: 'absolute',
						top: 16,
						right: 16,
						background: 'transparent',
						color: '#222',
						border: 'none',
						borderRadius: '50%',
						width: 32,
						height: 32,
						fontSize: 24,
						cursor: 'pointer',
						transition: 'background 0.2s',
					}}
					onMouseOver={e => (e.currentTarget.style.background = '#f5f5f5')}
					onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
					aria-label="Close"
					onClick={onClose}
				>
					×
				</button>
				<h2 style={{ marginTop: 0, marginBottom: 0, fontWeight: 700, fontSize: '1.25rem' }}>Project Info</h2>
												<form
													onSubmit={e => {
														e.preventDefault();
														if (!validate()) return;
														onSubmit({
															companyName,
															jobName,
															streetNumber,
															streetName,
															city,
															zipcode,
														});
													}}
													style={{ width: '100%' }}
												>
										<div style={{ marginBottom: 16 }}>
											<label style={{ color: '#222', fontWeight: 600, display: 'block', marginBottom: 4 }}>Company Name</label>
											<input
												type="text"
												value={companyName}
												onChange={e => setCompanyName(e.target.value)}
												style={{
													width: '100%',
													padding: 8,
													borderRadius: 6,
													border: '1px solid #ccc',
													background: companyName ? '#fff' : '#fff3e0',
													color: '#222',
													transition: 'background 0.2s',
												}}
											/>
											{errors.companyName && <div style={{ color: 'red', fontSize: 13 }}>{errors.companyName}</div>}
										</div>
										<div style={{ marginBottom: 24 }}>
											<label style={{ color: '#222', fontWeight: 600, display: 'block', marginBottom: 4 }}>Job Name</label>
											<input
												type="text"
												value={jobName}
												onChange={e => setJobName(e.target.value)}
												style={{
													width: '100%',
													padding: 8,
													borderRadius: 6,
													border: '1px solid #ccc',
													background: jobName ? '#fff' : '#fff3e0',
													color: '#222',
													transition: 'background 0.2s',
												}}
											/>
											{errors.jobName && <div style={{ color: 'red', fontSize: 13 }}>{errors.jobName}</div>}
										</div>
															<div style={{ marginBottom: 24 }}>
																<label style={{ color: '#222', fontWeight: 600, display: 'block', marginBottom: 4 }}>Street Number</label>
																<input
																	type="text"
																	value={streetNumber}
																	onChange={e => setStreetNumber(e.target.value)}
																	style={{
																		width: '100%',
																		padding: 8,
																		borderRadius: 6,
																		border: '1px solid #ccc',
																		background: streetNumber ? '#fff' : '#fff3e0',
																		color: '#222',
																		transition: 'background 0.2s',
																	}}
																/>
																{errors.streetNumber && <div style={{ color: 'red', fontSize: 13 }}>{errors.streetNumber}</div>}
															</div>
															<div style={{ marginBottom: 24 }}>
																<label style={{ color: '#222', fontWeight: 600, display: 'block', marginBottom: 4 }}>Street Name</label>
																<input
																	type="text"
																	value={streetName}
																	onChange={e => setStreetName(e.target.value)}
																	style={{
																		width: '100%',
																		padding: 8,
																		borderRadius: 6,
																		border: '1px solid #ccc',
																		background: streetName ? '#fff' : '#fff3e0',
																		color: '#222',
																		transition: 'background 0.2s',
																	}}
																/>
																{errors.streetName && <div style={{ color: 'red', fontSize: 13 }}>{errors.streetName}</div>}
															</div>
															<div style={{ marginBottom: 24 }}>
																<label style={{ color: '#222', fontWeight: 600, display: 'block', marginBottom: 4 }}>City</label>
																<input
																	type="text"
																	value={city}
																	onChange={e => setCity(e.target.value)}
																	style={{
																		width: '100%',
																		padding: 8,
																		borderRadius: 6,
																		border: '1px solid #ccc',
																		background: city ? '#fff' : '#fff3e0',
																		color: '#222',
																		transition: 'background 0.2s',
																	}}
																/>
																{errors.city && <div style={{ color: 'red', fontSize: 13 }}>{errors.city}</div>}
															</div>
															<div style={{ marginBottom: 24 }}>
																<label style={{ color: '#222', fontWeight: 600, display: 'block', marginBottom: 4 }}>Zipcode</label>
																<input
																	type="text"
																	value={zipcode}
																	onChange={e => setZipcode(e.target.value)}
																	style={{
																		width: '100%',
																		padding: 8,
																		borderRadius: 6,
																		border: '1px solid #ccc',
																		background: zipcode ? '#fff' : '#fff3e0',
																		color: '#222',
																		transition: 'background 0.2s',
																	}}
																/>
																{errors.zipcode && <div style={{ color: 'red', fontSize: 13 }}>{errors.zipcode}</div>}
															</div>

					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
						<button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#eee', fontWeight: 600 }}>Cancel</button>
						<button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600 }}>Save</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default PickerModal;


// PickerModal deleted for redesign. New modal popup will be implemented from scratch.
