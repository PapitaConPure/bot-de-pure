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
		private readonly List<CommandOption> options;
		private readonly List<AliasField> aliasFields;

		public FPrincipal() {
			this.InitializeComponent();
			this.options = new List<CommandOption>();
			this.aliasFields = new List<AliasField>();
		}

		private void BtnGenerar_Click(object sender, EventArgs e) {
			if(this.sflComando.ShowDialog() != DialogResult.OK)
				return;

			MessageBoxButtons botonesError = MessageBoxButtons.AbortRetryIgnore;
			MessageBoxButtons botonesReporte = MessageBoxButtons.OK;
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

					string código = commandBuilder.ImprimirTodo();
					if(new FCommandPreview(código).ShowDialog() == DialogResult.OK) {
						fileStream = new FileStream(this.sflComando.FileName, FileMode.CreateNew, FileAccess.Write);
						streamWriter = new StreamWriter(fileStream);
						streamWriter.Write(código);
					}

					resultado = DialogResult.OK;
				} catch(ArgumentNullException ex) {
					resultado = MessageBox.Show(ex.Message, "Error de valor", botonesReporte, íconoCuidado);
				} catch(FormatException ex) {
					resultado = MessageBox.Show(ex.Message, "Error de formato", botonesReporte, íconoCuidado);
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

					if(resultado == DialogResult.Abort)
						throw ex;
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
			AliasField aliasField = new AliasField(this);
			Panel panel = aliasField.pnlAliasField;

			aliasField.tbAlias.InputText = this.tbNuevoAlias.InputText;
			panel.TabIndex = this.pnlAlias.TabIndex;

			this.aliasFields.Add(aliasField);
			this.pnlAlias.Controls.Add(panel);
			panel.BringToFront();
			this.pnlAlias.Update();

			this.tbNuevoAlias.Clear();
			this.tbNuevoAlias.Focus();
		}

		internal void RemoverAlias(AliasField aliasField) {
			Panel panel = aliasField.pnlAliasField;
			this.pnlAlias.Controls.Remove(panel);
			this.aliasFields.Remove(aliasField);
			aliasField.Dispose();
			this.pnlAlias.Height -= 45;
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

		private void BtnAgregarParámetro_Click(object sender, EventArgs e) {
			FParam fParam = new FParam(false);

			if(fParam.ShowDialog() != DialogResult.OK)
				return;

			string nombre = fParam.tbNombre.InputText;
			string desc = fParam.tbDescripción.InputText;
			CommandParam.ParamType type = (CommandParam.ParamType)fParam.cmbTipos.SelectedItem;

			this.options.Add(new CommandParam(nombre, desc, type));
			this.ActualizarListaOpciones();
		}

		private void BtnAgregarBandera_Click(object sender, EventArgs e) {
			FFlag fFlag = new FFlag(false);

			if(fFlag.ShowDialog() != DialogResult.OK)
				return;

			char[] shortIds = fFlag.tbCortos.InputText.ToCharArray();
			string[] longIds = new string[0];
			string desc = fFlag.tbDescripción.InputText;

			if(fFlag.IsExpressive) {
				string nombre = fFlag.tbNombre.InputText;
				CommandParam.ParamType type = (CommandParam.ParamType)fFlag.cmbTipos.SelectedItem;

				this.options.Add(new CommandFlagExpressive(shortIds, longIds, desc, nombre, type));
			} else
				this.options.Add(new CommandFlag(shortIds, longIds, desc));

			this.ActualizarListaOpciones();
		}

		private void DgvOpciones_CellContentDoubleClick(object sender, DataGridViewCellEventArgs e) {
			int id = e.RowIndex;
			CommandOption option = this.options[id];

			string nombre;
			string desc;
			DialogResult resultado;
			if(option is CommandParam) {
				FParam fParam = new FParam(true);
				resultado = fParam.ShowDialog();

				if(resultado == DialogResult.Abort) {
					this.options.RemoveAt(id);
					this.ActualizarListaOpciones();
					return;
				}

				if(resultado != DialogResult.OK)
					return;

				nombre = fParam.tbNombre.InputText;
				desc = fParam.tbDescripción.InputText;
				CommandParam.ParamType type = (CommandParam.ParamType)fParam.cmbTipos.SelectedItem;

				this.options[id] = new CommandParam(nombre, desc, type);
			} else {
				CommandFlag flag = option as CommandFlag;
				char[] shortIds = flag.ShortIds;
				string[] longIds = flag.LongIds;

				FFlag fFlag = new FFlag(true);
				resultado = fFlag.ShowDialog();

				if(resultado == DialogResult.Abort) {
					this.options.RemoveAt(id);
					this.ActualizarListaOpciones();
					return;
				}

				if(resultado != DialogResult.OK)
					return;

				desc = fFlag.tbDescripción.InputText;

				if(option is CommandFlagExpressive) {
					nombre = fFlag.tbNombre.InputText;
					CommandParam.ParamType type = (CommandParam.ParamType)fFlag.cmbTipos.SelectedItem;

					this.options[id] = new CommandFlagExpressive(shortIds, longIds, desc, nombre, type);
				} else
					this.options[id] = new CommandFlag(shortIds, longIds, desc);
			}

			this.ActualizarListaOpciones();
		}

		private void ActualizarListaOpciones() {
			this.dgvOpciones.Rows.Clear();
			foreach(CommandOption option in this.options)
				this.dgvOpciones.Rows.Add(
					option.Type,
					option.Identifier,
					option.Desc
				);
		}
	}
}
