using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO;

namespace CommandBuilder {
	public partial class FPrincipal: Form {
		private List<AliasField> aliasFields;

		public FPrincipal() {
			this.InitializeComponent();
			this.aliasFields = new List<AliasField>();
		}

		private void BtnGenerar_Click(object sender, EventArgs e) {
			if(this.sflComando.ShowDialog() != DialogResult.OK)
				return;

			MessageBoxButtons botonesError = MessageBoxButtons.AbortRetryIgnore;
			MessageBoxIcon íconoCuidado = MessageBoxIcon.Warning;
			MessageBoxIcon íconoError = MessageBoxIcon.Error;
			DialogResult resultado = DialogResult.None;
			do {
				FileStream fileStream = null;
				StreamWriter streamWriter = null;
				try {
					CommandBuilder commandBuilder = new CommandBuilder();

					List<string> aliases = new List<string>();
					foreach(AliasField aliasField in this.aliasFields)
						aliases.Add(aliasField.tbAlias.InputText);
					CommandManager commandManager = new CommandManager(
						this.tbNombre.InputText,
						aliases,
						this.tbDescripciónLarga.InputText,
						this.tbDescripciónBreve.InputText);
					commandBuilder.AgregarImprimible(commandManager);

					CommandTagsManager commandTagsManager = new CommandTagsManager();
					foreach(CommandTagsManager.CommandTag etiqueta in this.VerEtiquetas())
						commandTagsManager.AgregarEtiqueta(etiqueta);
					commandBuilder.AgregarImprimible(commandTagsManager);

					CommandOptionsManager commandOptionsManager = new CommandOptionsManager();
					commandBuilder.AgregarImprimible(commandOptionsManager);

					MessageBox.Show(commandBuilder.ImprimirTodo());

					fileStream = new FileStream(this.sflComando.FileName, FileMode.CreateNew, FileAccess.Write);
					streamWriter = new StreamWriter(fileStream);
					streamWriter.Write(commandBuilder.ImprimirTodo());

					resultado = DialogResult.OK;
				} catch(ArgumentNullException ex) {
					resultado = MessageBox.Show(ex.Message, "Error de valor", botonesError, íconoCuidado);
				} catch(FormatException ex) {
					resultado = MessageBox.Show(ex.Message, "Error de formato", botonesError, íconoCuidado);
				} catch(IOException ex) {
					resultado = MessageBox.Show(ex.Message, "Error de flujo de archivo", botonesError, íconoError);
				} catch(UnauthorizedAccessException ex) {
					resultado = MessageBox.Show(ex.Message, "Error de acceso a archivo", botonesError, íconoError);
				} catch(Exception ex) {
					resultado = MessageBox.Show(
						$"Ocurrió un error inesperado.\n" +
						$"Puede deberse a un problema con la aplicación.\n\n" +
						$"Detalles:\n{ex.Message}",
						"Error inesperado",
						botonesError,
						íconoError);
				} finally {
					if(streamWriter != null)
						streamWriter.Close();
					if(fileStream != null)
						fileStream.Dispose();
				}
			} while(resultado == DialogResult.Retry);
		}

		private void BtnNuevoAlias_Click(object sender, EventArgs e) {
			if(this.tbNuevoAlias.Empty)
				return;

			foreach(AliasField af in this.aliasFields)
				if(af.tbAlias.InputText == this.tbNuevoAlias.InputText)
					return;

			this.pnlAlias.Height += 45;
			AliasField aliasField = new AliasField(this, this.aliasFields.Count);
			this.aliasFields.Add(aliasField);

			aliasField.tbAlias.InputText = this.tbNuevoAlias.InputText;

			Panel panel = aliasField.pnlAliasField;
			panel.TabIndex = this.pnlAlias.TabIndex;
			this.pnlAlias.Controls.Add(panel);
			panel.BringToFront();
			this.tbNuevoAlias.Clear();
			this.tbNuevoAlias.Focus();
		}

		internal void RemoverAlias(int id) {
			AliasField aliasField = this.aliasFields[id];
			Panel panel = aliasField.pnlAliasField;
			this.pnlAlias.Controls.Remove(panel);
			this.aliasFields.RemoveAt(id);
			aliasField.Dispose();
			this.pnlAlias.Height -= 45;

			for(int i = id; i < this.aliasFields.Count; i++)
				this.aliasFields[i].Id--;
		}

		private CommandTagsManager.CommandTag[] VerEtiquetas() {
			List<CommandTagsManager.CommandTag> etiquetas = new List<CommandTagsManager.CommandTag>();

			if(this.cbEtiquetaCommon.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Common);

			if(this.cbEtiquetaMod.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Mod);

			if(this.cbEtiquetaEmote.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Emote);

			if(this.cbEtiquetaMeme.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Meme);

			if(this.cbEtiquetaChaos.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Chaos);

			if(this.cbEtiquetaGame.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Game);

			if(this.cbEtiquetaOutdated.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Outdated);

			if(this.cbEtiquetaMaintenance.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Maintenance);

			if(this.cbEtiquetaPapa.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Papa);

			if(this.cbEtiquetaHourai.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Hourai);

			if(this.cbEtiquetaGuide.Checked)
				etiquetas.Add(CommandTagsManager.CommandTag.Guide);

			return etiquetas.ToArray();
		}
	}
}
