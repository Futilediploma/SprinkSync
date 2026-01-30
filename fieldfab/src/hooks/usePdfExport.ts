import { exportMultiPiecePdf } from '../components/exportPdf';
import type { Project } from '../types';

export function usePdfExport() {
    const exportPdf = async (project: Project | null, pieces: any[]) => {
        if (!project || pieces.length === 0) return;
        await exportMultiPiecePdf(project, pieces);
    };

    return { exportPdf };
}
