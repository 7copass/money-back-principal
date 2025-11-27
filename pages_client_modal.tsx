// MODAL DE CADASTRO RÁPIDO DE CLIENTE
const ClientQuickRegisterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onClientRegistered: (client: Client) => void;
    companyId: string;
    prefilledData?: { cpf?: string };
}> = ({ isOpen, onClose, onClientRegistered, companyId, prefilledData }) => {
    const [formData, setFormData] = useState({
        name: '',
        cpf: prefilledData?.cpf || '',
        phone: '',
        email: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (prefilledData?.cpf) {
            setFormData(prev => ({ ...prev, cpf: prefilledData.cpf || '' }));
        }
    }, [prefilledData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return;

        setSaving(true);
        try {
            const newClient = await api.addClient(companyId, {
                ...formData,
                status: 'Nenhum',
                points: 0,
                totalCashback: 0,
                lastPurchase: new Date().toISOString()
            });
            onClientRegistered(newClient);
            setFormData({ name: '', cpf: '', phone: '', email: '' });
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            alert("Erro ao cadastrar cliente. Tente novamente.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Cadastro Rápido de Cliente</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-1">Nome Completo</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">CPF</label>
                        <Input
                            value={formData.cpf}
                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                            required
                            placeholder="000.000.000-00"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">Telefone</label>
                        <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            placeholder="(11) 98765-4321"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <Button type="button" onClick={onClose} className="flex-1 bg-gray-400 hover:bg-gray-500">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving} className="flex-1">
                            {saving ? 'Cadastrando...' : 'Cadastrar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

