/* eslint-disable @typescript-eslint/no-explicit-any */
import { exportMultiPiecePdf } from '../components/exportPdf';
import type { Project, Piece } from '../types';

export function usePdfExport() {
    const exportPdf = async (project: Project | null, pieces: Piece[]) => {
        if (!project || pieces.length === 0) return;
        await exportMultiPiecePdf(project, pieces);
    };

    return { exportPdf };
}
